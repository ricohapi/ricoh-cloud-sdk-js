/**
 * Copyright (c) 2018 Ricoh Company, Ltd. All Rights Reserved.
 * See LICENSE for more information
 */

const Koa = require('koa');

const KoaRouter = require('koa-router');
const koaConvert = require('koa-convert');
const koaCors = require('kcors');
const serve = require('koa-better-serve');

const axios = require('axios');
const jwt = require('jsonwebtoken');
const queryString = require('query-string');

const CLIENT_ID='';
const CLIENT_SECRET='';
const AUTH_ENDPOINT = 'https://auth.api.ricoh/v1';

const REDIRECT_URI = 'http://localhost:3000/app';

const app = new Koa;
const router = new KoaRouter;

let state = '';
let nonce = '';

router.get('/signin', ctx => {
  state = Math.random().toString(10).slice(-8); // ** Set unique value for CSRF protection **
  nonce = Math.random().toString(10).slice(-8); // ** Set unique value for replay attack protection **

  const params = {
    scope: 'openid xmpp.api.ricoh/v1/http-bind',
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    state,
    nonce,
  };
  ctx.redirect(AUTH_ENDPOINT + `/authorization?${queryString.stringify(params)}`);
});

function tokenRequest(code) {
  const params = {
    grant_type: 'authorization_code',
    redirect_uri: REDIRECT_URI,
    code,
  };
  return {
    method: 'post',
    url: `${AUTH_ENDPOINT}/token`,
    data: queryString.stringify(params),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    auth: { username: CLIENT_ID, password: CLIENT_SECRET },
  };
}

router.get('/app', async (ctx, next) => {
  await next();
  if (ctx.request.query.state !== state) ctx.throw(401, 'access_denied');
  const tokenRet = await axios.request(tokenRequest(ctx.request.query.code));
  const id_token = tokenRet.data.id_token;
  // ** BAD CODE FOR SAMPLE ** you must verify id_token by JWK with https://auth.api.ricoh/v1/discovery/keys
  const decoded = jwt.decode(id_token);
  if (decoded.nonce !== nonce) ctx.throw(401, 'access_denied');
  // ** you may manage end-user by decoded.sub here
  const params = {
    user: decoded.sub,
    token: encodeURIComponent(tokenRet.data.access_token),
  };
  ctx.redirect(`http://localhost:3000/index.html?${queryString.stringify(params)}`);
});


app.use(koaConvert(koaCors()));
app.use(router.routes());
app.use(router.allowedMethods());

app.use(serve('./public', '/'));

app.listen(3000);
