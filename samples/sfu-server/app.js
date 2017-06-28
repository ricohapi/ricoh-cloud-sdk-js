/**
 * Copyright (c) 2017 Ricoh Company, Ltd. All Rights Reserved.
 * See LICENSE for more information
 */

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const axios = require('axios');

const CLIENT_ID = '';
const CLIENT_SECRET = '';

const AUTH_ENDPOINT = 'https://auth.api.ricoh';
const ENDPOINT = 'https://sfu.api.ricoh';

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

function authRequest() {
  return {
    method: 'post',
    url: `${AUTH_ENDPOINT}/v1/token`,
    data: 'grant_type=client_credentials&scope=sfu.api.ricoh/v1/sfu',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    auth: { username: CLIENT_ID, password: CLIENT_SECRET },
  };
}

function roomRequest(token) {
  return {
    method: 'post',
    url: `${ENDPOINT}/v1/rooms`,
    headers: { Authorization: `Bearer ${token}` },
  };
}

function ticketRequest(token, room, dir) {
  return {
    method: 'post',
    url: `${ENDPOINT}/v1/rooms/${room}/tickets`,
    data: { direction: dir },
    headers: { Authorization: `Bearer ${token}` },
  };
}

function listRequest(token) {
  return {
    method: 'get',
    url: `${ENDPOINT}/v1/rooms`,
    headers: { Authorization: `Bearer ${token}` },
  };
}

function makeRoom(req, accessToken) {
  if ('room' in req.body) return Promise.resolve(req.body.room);
  return axios.request(roomRequest(accessToken))
    .then(roomRet => Promise.resolve(roomRet.data.id));
}

const ticketRouter = express.Router();

ticketRouter.post('', (req, res, next) => {
  let accessToken = '';
  axios.request(authRequest())
    .then((tokenRet) => {
      accessToken = tokenRet.data.access_token;
      return makeRoom(req, accessToken);
    })
    .then(roomId => axios.request(ticketRequest(accessToken, roomId, req.body.direction)))
    .then(ticketRet => res.json(ticketRet.data))
    .catch(next);
});

app.use('/ticket', ticketRouter);

const listRouter = express.Router();

listRouter.get('', (req, res, next) => {
  axios.request(authRequest())
    .then((tokenRet) => {
      const accessToken = tokenRet.data.access_token;
      return axios.request(listRequest(accessToken));
    })
    .then(listRet => res.json(listRet.data))
    .catch(next);
});

app.use('/list', listRouter);

module.exports = app;
