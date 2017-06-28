/**
 * Copyright (c) 2017 Ricoh Company, Ltd. All Rights Reserved.
 * See LICENSE for more information
 */

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const CLIENT_ID = '';
const CLIENT_SECRET = '';

function authRequest() {
  return {
    method: 'post',
    url: "https://auth.api.ricoh/v1/token",
    data: 'grant_type=client_credentials&scope=sfu.api.ricoh/v1/sfu',
    headers: { 'Content-Type':'application/x-www-form-urlencoded'},
    auth: { username: CLIENT_ID, password: CLIENT_SECRET }
  }
}

function roomRequest(token) {
  return {
    method: 'post',
    url: "https://sfu.api.ricoh/v1/rooms",
    headers: { Authorization: `Bearer ${token}` },
  }
}

function ticketRequest(token, room, dir) {
  return {
    method: 'post',
    url: `https://sfu.api.ricoh/v1/rooms/${room}/tickets`,
    data: { direction: dir },
    headers: { Authorization: `Bearer ${token}` },
  }
}

function listRequest(token) {
  return {
    method: 'get',
    url: `https://sfu.api.ricoh/v1/rooms`,
    headers: { Authorization: `Bearer ${token}` },
  }
}

function makeRoom(req, access_token) {
  if ("room" in req.body) return Promise.resolve(req.body.room);
  return axios.request(roomRequest(access_token))
    .then(room_ret => Promise.resolve(room_ret.data.id));
}

const router = express.Router();

router.post('', function(req, res, next) {
  let access_token = '';
  axios.request(authRequest())
    .then(token_ret => {
      access_token = token_ret.data.access_token;
      return makeRoom(req, access_token);
    })
    .then(room_id => axios.request(ticketRequest(access_token, room_id, req.body.direction)))
    .then(ticket_ret => res.json(ticket_ret.data))
    .catch(next);
});

app.use('/ticket', router);

const router2 = express.Router();

router2.get('', function(req, res, next) {
  let access_token = '';
  axios.request(authRequest())
    .then(token_ret => {
      access_token = token_ret.data.access_token;
      return axios.request(listRequest(access_token));
    })
    .then(list_ret => res.json(list_ret.data))
    .catch(next);
});

app.use('/list', router2);

module.exports = app;
