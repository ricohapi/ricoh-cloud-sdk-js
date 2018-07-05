/* global Vue, BOSHClient */
/**
 * Copyright (c) 2018 Ricoh Company, Ltd. All Rights Reserved.
 * See LICENSE for more information
 */

let bosh = null;

const DOMAIN = 'xmpp.api.ricoh';

/* eslint-disable no-unused-vars */
const app = new Vue({
  el: '#app',
  data: {
    state: 'ready',
    user: '',
    token: '',
    sndmsg: '',
    newpeer: '',
    rcvmsg: '',
    peers: [],
    target: '',
    chat: '',
    errmsg: '',
  },
  mounted: function() {
    this.onload();
  },
  methods: {
    getParams: function() {
      const params = {};
      const query = window.location.search.substr(1);
      query.split('&').forEach((item) => {
        const tmp = item.split('=');
        params[tmp[0]] = decodeURIComponent(tmp[1]);
      });
      return params;
    },
    onload: function() {
      const params = this.getParams();
      this.user = params['user'];
      this.token = params['token'];
    },
    connect: function() {
      const self = this;
      this.peers = [];

      bosh = new BOSHClient();
      bosh.onMessage = (from, message) => {
        self.target = from;
        self.state = 'opened';
        self.chat += `${this.nowstr()}: (${from.substr(0,10)}...) ${message}\n`;
      };
      bosh.onError = (status) => {
        self.state = 'error';
        self.errmsg = status;
      };
      bosh.onConnect = () => {
        self.state = 'connected';
      };
      bosh.onPresence = (from, state) => {
        if (state === 'subscribe') {
          bosh.subscribed(from);
          bosh.subscribe(from);
        } else if (state === 'unsubscribe') {
          bosh.unsubscribe(from);
        } else if (state === 'unsubscribed') {
          bosh.unsubscribed(from);
          bosh.unsubscribe(from);
        }
      };
      bosh.onRoster = (peers) => {
        self.peers = peers;
      };
      bosh.connect(`${this.user}@${DOMAIN}`, this.token);
      this.state = 'connecting';
    },
    open: function(id) {
      this.target = id;
      this.state = 'opened';
      this.chat = 'start chat with ' + id + '...\n';
    },
    rename: function(jid, name) {
      if (!bosh) return;
      bosh.rename(jid, name);
    },
    subscribe: function() {
      if (!bosh) return;
      bosh.subscribe(`${this.newpeer}@${DOMAIN}`);
    },
    unsubscribe: function(jid) {
      if (!bosh) return;
      bosh.unsubscribe(jid);
    },
    away: function() {
      if (!bosh) return;
      bosh.presence('away');
    },
    onChat: function() {
      if (!bosh) return;
      bosh.presence('chat');
    },
    send: function() {
      if (!bosh) return;
      if (this.sndmsg.length === 0) return;
      bosh.send(`${this.target}`, this.sndmsg);
      this.chat += `${this.nowstr()}: (${this.user.substr(0,10)}...) ${this.sndmsg}\n`;
      this.sndmsg = '';
    },
    nowstr: function() {
      const now = new Date();
      return now.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    },
    disconnect: function() {
      bosh.disconnect();
      bosh = null;
      this.chat = '';
      this.state = 'ready';
    },
  },
});
