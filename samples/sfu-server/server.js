/**
 * Copyright (c) 2017 Ricoh Company, Ltd. All Rights Reserved.
 * See LICENSE for more information
 */

const Koa = require('koa');
const KoaRouter = require('koa-router');
const koaConvert = require('koa-convert');
const koaCors = require('kcors');
const serve = require('koa-better-serve');
const bodyParser = require('koa-bodyparser');
const axios = require('axios');

const AUTH_ENDPOINT = process.env.RDC_AUTH_ENDPOINT || 'https://auth.api.ricoh';
const ENDPOINT = process.env.RDC_SFU_ENDPOINT || 'https://sfu.api.ricoh';

function getToken() {
  if (process.env.RDC_AUTH_TOKEN) return Promise.resolve(process.env.RDC_AUTH_TOKEN);
  const params = {
    method: 'post',
    url: `${AUTH_ENDPOINT}/v1/token`,
    data: 'grant_type=client_credentials&scope=sfu.api.ricoh/v1/sfu',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    auth: { username: process.env.RDC_CLIENT_ID, password: process.env.RDC_CLIENT_SECRET },
  };
  return axios.request(params).then(ret => ret.data.access_token);
}

function listRooms(token) {
  const params = {
    method: 'get',
    url: `${ENDPOINT}/v1/rooms`,
    headers: { Authorization: `Bearer ${token}` },
  };
  return axios.request(params).then(ret => ret.data);
}

function getRoom(token, body) {
  if ('room' in body) return Promise.resolve(body.room);
  const params = {
    method: 'post',
    url: `${ENDPOINT}/v1/rooms`,
    headers: { Authorization: `Bearer ${token}` },
  };
  return axios.request(params).then(ret => ret.data.id);
}

function getTicket(token, id, body) {
  const params = {
    method: 'post',
    url: `${ENDPOINT}/v1/rooms/${id}/tickets`,
    data: { direction: body.direction },
    headers: { Authorization: `Bearer ${token}` },
  };
  return axios.request(params).then(ret => ret.data);
}

function deleteRoom(token, body) {
  const params = {
    method: 'delete',
    url: `${ENDPOINT}/v1/rooms/${body.room}`,
    headers: { Authorization: `Bearer ${token}` },
  };
  return axios.request(params).then(ret => ret.data);
}

const router = new KoaRouter;
router.get('/list', async(ctx, next) => {
  const token = await getToken().catch(() => ctx.throw(401, 'AuthFail'));
  ctx.body = await listRooms(token).catch(() => ctx.throw(500, 'ListFail'));
});

router.post('/ticket', async(ctx, next) => {
  const token = await getToken().catch(() => ctx.throw(401, 'AuthFail'));
  const id = await getRoom(token, ctx.request.body).catch(() => ctx.throw(500, 'RoomFail'));
  ctx.body = await getTicket(token, id, ctx.request.body).catch(() => ctx.throw(500, 'TicketFail'));
});

router.delete('/room', async(ctx, next) => {
  const token = await getToken().catch(() => ctx.throw(401, 'AuthFail'));
  ctx.body = await deleteRoom(token, ctx.request.body).catch(e => {
    if(e.response.status == 404) ctx.body = 'done';
    else ctx.throw(500, 'DelFail')
  });
});

if (!process.env.RDC_CLIENT_ID || !process.env.RDC_CLIENT_SECRET) {
  console.error('ERROR: Required env value is not set.');
  process.exit(0);
}

const app = new Koa;
app.use(bodyParser());
app.use(koaConvert(koaCors()));
app.use(router.routes());
app.use(router.allowedMethods());
app.use(serve('./public', '/'));
app.listen(3000);