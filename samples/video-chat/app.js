/**
 * Copyright (c) 2017 Ricoh Company, Ltd. All Rights Reserved.
 * See LICENSE for more information
 */

const express = require('express');
const path = require('path');
const queryString = require('query-string');
const axios = require('axios');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const CLIENT_ID = '';
const CLIENT_SECRET = '';

const AUTH_ENDPOINT = 'https://auth.api.ricoh/v1';

const REDIRECT_URI = 'http://localhost:3000/app';


const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

let state = '';
let nonce = '';

const signinRouter = express.Router();

signinRouter.get('', (req, res) => {
  state = Math.random().toString(10).slice(-8); // ** Set unique value for CSRF protection **
  nonce = Math.random().toString(10).slice(-8); // ** Set unique value for replay attack protection **
  const params = {
    scope: 'openid turn.api.ricoh/v1/turn',
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    state,
    nonce,
  };
  console.log(AUTH_ENDPOINT + `/authorization?${queryString.stringify(params)}`);
  res.redirect(AUTH_ENDPOINT + `/authorization?${queryString.stringify(params)}`);
});

app.use('/signin', signinRouter);


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

const appRouter = express.Router();

appRouter.get('', (req, res, next) => {
  if (req.query.state !== state) next();
  else {
    axios.request(tokenRequest(req.query.code))
      .then((tokenRet) => {
        const id_token =  tokenRet.data.id_token;

        // ** THIS IS BAD CODE FOR SAMPLE **
        // You need to fully verify the token for security here.
        // Please refer 'ID Token' section of 'Authorization Code Grant' on 'RICOH Cloud API Developer Guide'.
        const decoded = jwt.decode(id_token);
        if (decoded.nonce !== nonce) next();

        // ** You may manage end-user by decoded.sub here. **

        const params = {
          user: decoded.sub,
          token: encodeURIComponent(tokenRet.data.access_token),
        };
        res.redirect(`http://localhost:3000/?${queryString.stringify(params)}`);
      })
      .catch(next);
  }
});

app.use('/app', appRouter);

module.exports = app;
