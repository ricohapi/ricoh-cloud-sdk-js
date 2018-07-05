/* global Strophe, $pres, $iq, $msg */
/**
 * Copyright (c) 2018 Ricoh Company, Ltd. All Rights Reserved.
 * See LICENSE for more information
 */

const ENDPOINT = 'https://xmpp.api.ricoh/v1/http-bind/';

const STATUS = {};
STATUS[Strophe.Status.CONNECTING] = 'connecting';
STATUS[Strophe.Status.CONNFAIL] = 'connfail';
STATUS[Strophe.Status.AUTHENTICATING] = 'authenticating';
STATUS[Strophe.Status.AUTHFAIL] = 'authfail';
STATUS[Strophe.Status.CONNECTED] = 'connected';
STATUS[Strophe.Status.DISCONNECTED] = 'disconnected';
STATUS[Strophe.Status.DISCONNECTING] = 'disconnecting';
STATUS[Strophe.Status.ATTACHED] = 'attached';
STATUS[Strophe.Status.ERROR] = 'error';
STATUS[Strophe.Status.REDIRECT] = 'redirect';
STATUS[Strophe.Status.CONNTIMEOUT] = 'timeout';

/* eslint-disable no-unused-vars */
class BOSHClient {
  constructor() {
    this.onMessage = null;
    this.onPresence = null;
    this.onRoster = null;
    this.onError = null;
    this.onConnect = null;
    this._conn = null;
    this._user = '';
    this._roster = [];
  }

  _onConnect(status) {
    /* eslint-disable no-console */
    console.log(`connect handler: ${STATUS[status]}`);
    if (status === Strophe.Status.ERROR
        || status === Strophe.Status.CONNTIMEOUT
        || status === Strophe.Status.AUTHFAIL) {
      if (this.onError) this.onError(STATUS[status]);
    }
    if (status !== Strophe.Status.CONNECTED) return true;
    this._conn.addHandler(this._onMessage.bind(this), null, 'message', 'chat');
    this._conn.addHandler(this._onPresence.bind(this), null, 'presence');
    this._requestRoster();
    this._conn.send($pres());
    if (this.onConnect) this.onConnect();
    return true;
  }

  _onMessage(stanza) {
    const from = Strophe.getBareJidFromJid(stanza.attributes.from.textContent);
    if (from === this._user) return true;
    if (this.onMessage) this.onMessage(from, stanza.firstChild.textContent);
    return true;
  }

  _getState(jid) {
    let state = null;
    this._roster.forEach((r) => {
      if (r.id === jid) state = r.state;
    });
    return state;
  }

  _onRoster(stanza) {
    this._roster = (stanza.firstChild.hasChildNodes()) ?
      Array.from(stanza.firstChild.childNodes).map((n) => {
        const jid = n.attributes.jid.textContent;
        const state = this._getState(jid) || 'pending';
        const name = (n.attributes.name) ? n.attributes.name.textContent : '';
        return { id: jid, state: state, name: name };
      }) : [];
    if (this.onRoster) this.onRoster(this._roster);
    return true;
  }

  _onPresence(stanza) {
    const from = Strophe.getBareJidFromJid(stanza.attributes.from.textContent);
    if (from === this._user) return true;

    const typeattr = stanza.attributes.type;
    let state = (typeattr) ? typeattr.textContent : 'available';

    stanza.childNodes.forEach((c) => {
      if (c.nodeName === 'show') state = c.textContent;
    });
    if (this.onPresence) this.onPresence(from, state);
    /* eslint-disable no-param-reassign */
    this._roster.forEach((r) => {
      if (r.id === from) r.state = state;
    });
    if (this.onRoster) this.onRoster(this._roster);
    return true;
  }

  _setRoster(jid, type, item) {
    this._conn.sendIQ($iq({ type: 'set' }).c('query', { xmlns: 'jabber:iq:roster' }).c('item', item));
    this._conn.send($pres({ to: jid, type: type }));
  }

  _requestRoster() {
    this._conn.sendIQ($iq({ type: 'get' }).c('query', { xmlns: 'jabber:iq:roster' }), this._onRoster.bind(this));
  }

  subscribed(jid) {
    this._setRoster(jid, 'subscribed', { jid: jid, name: jid.substr(0,10) });
    this._requestRoster();
  }

  unsubscribed(jid) {
    this._setRoster(jid, 'unsubscribed', { jid: jid, name: jid.substr(0,10), subscription: 'remove' });
    this._requestRoster();
  }
  subscribe(jid) {
    this._setRoster(jid, 'subscribe', { jid: jid, name: jid.substr(0,10) });
    this._requestRoster();
  }

  unsubscribe(jid) {
    this._setRoster(jid, 'unsubscribe', { jid: jid, subscription: 'remove' });
    this._requestRoster();
  }

  rename(jid, name) {
    this._conn.sendIQ($iq({ type: 'set' }).c('query', { xmlns: 'jabber:iq:roster' }).c('item', {jid: jid, name: name}));
    this._requestRoster();
  }

  presence(type) {
    this._conn.send($pres().c('show').t(type));
  }

  connect(user, pass) {
    this._user = user;
    this._conn = new Strophe.Connection(ENDPOINT, { mechanisms: [Strophe.SASLPlain] });
    this._conn.connect(user, pass, this._onConnect.bind(this),3);
  }

  disconnect() {
    if (!this._conn) return;
    this._conn.disconnect('normal');
    this._conn = null;
  }

  send(jid, msg) {
    this._conn.send($msg({ to: jid, type: 'chat' }).c('body').t(msg).up());
  }
}
