/**
 * Copyright (c) 2017 Ricoh Company, Ltd. All Rights Reserved.
 * See LICENSE for more information
 */

class SFUClient { // eslint-disable-line no-unused-vars
  constructor(dir, id, onlyTls = false) {
    this._ws = null;
    this._pc = null;

    this._video = null;
    this._audio = null;
    this._stream = null;

    this._id = id;
    this._role = dir === 'down' ? 'downstream' : 'upstream';
    this._client_id = '';
    this._is_multi = false;

    this._remotes = [];

    const ua = window.navigator.userAgent.toLowerCase();
    this._isSafari = ((ua.indexOf('safari') !== -1) && (ua.indexOf('chrome') === -1));

    // for caller
    this.onclose = null;
    this.onaddstream = null;
    this.onlyTls = onlyTls;
  }

  setMedia(video, audio, stream = null) {
    this._video = video;
    this._audio = audio;
    this._stream = stream;
  }

  disconnect() {
    if (!this._ws) return;
    this._ws.send(JSON.stringify({ type: 'disconnect' }));
    this._ws.close();
    this._ws = null;
  }

  connect(url, token, multi = false) {
    this._retried = 0;
    this._url = url;
    this._token = token;
    this._is_multi = multi;
    this._connect();
  }

  _connect() {
    this._ws = new WebSocket(this._url);
    const msg = {
      type: 'connect',
      video: this._video,
      audio: this._audio,
      role: this._role,
      metadata: { access_token: this._token },
      channel_id: this._id,
      multistream: this._is_multi,
    };

    this._ws.onopen = () => {
      this._ws.send(JSON.stringify(msg));
    };
    this._ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.client_id && (this._client_id === '')) this._client_id = message.client_id;
      if (message.type === 'offer') this._answer(message);
      else if (message.type === 'update') this._handleSdp(message, 'update');
      else if (message.type === 'ping') this._ws.send(JSON.stringify({ type: 'pong' }));
    };
    this._ws.onclose = (event) => {
      if (this._pc) {
        this._pc.close();
        this._pc = null;
      }
      if (this._ws) {
        this._ws.close();
        this._ws = null;
      }
      if (event === true) return;
      if (this.onclose) this.onclose();
    };
  }

  _createPeerConnection(config) {
    const self = this;
    const pc = new RTCPeerConnection(config);
    pc.onclose = console.log;
    pc.onerror = console.error;
<<<<<<< .mine

=======
<<<<<<< .mine
>>>>>>> .theirs
    pc.oniceconnectionstatechange = () => {
      console.log(`ICE: ${pc.iceConnectionState}`);
      if (pc.iceConnectionState !== 'checking') return;

      const timerId = setInterval(() => {
        if (!self._pc || self._pc.iceConnectionState !== 'connected') {
          console.log('ICE Timeout');
          clearInterval(timerId);
          if (!self._ws) return;
          if (self._retried >= 2) return;
          self._ws.onclose(true); // silent
          setTimeout(() => {
            self._connect(self._url, self._token, self._is_multi);
            self._retried += 1;
            console.log('signaling retried');
          }, 1000);
        }
      }, 5000);














=======
    pc.oniceconnectionstatechange = () => {
      console.log('ICE: ' + pc.iceConnectionState);
      if (pc.iceConnectionState !== 'checking') return;
      const timerId = setInterval(() => {
        if (!self._pc || self._pc.iceConnectionState !== 'connected') {
          if(self._ws) self._ws.close();
          console.log("ICE Timeout");
          clearInterval(timerId);
        }
      }, 3000);
    };
<<<<<<< .mine

    pc.onicecandidate = (event) => {
      if (!event.candidate) return;
      this._ws.send(JSON.stringify({ type: 'candidate', candidate: event.candidate.candidate }));
    };

    pc.ontrack = (event) => {
      if (!self._client_id) return;
      const stream = event.streams[0];
      if (this._is_multi && (stream.id === self._client_id)) return;
      if (stream.id === 'default') return;
      if (this._remotes.indexOf(stream.id) !== -1) return;
      this._remotes.push(stream.id);
      if (self.onaddstream) self.onaddstream(event);
    };

    pc.onremovestream = (event) => {
      const { stream } = event;
      const idx = this._remotes.indexOf(stream.id);
      if (idx === -1) return;
      delete this._remotes[idx];
    };

    if (this._stream) this._stream.getTracks().forEach(track => pc.addTrack(track, this._stream));











=======
    pc.onicecandidate = (event) => {
      if (!event.candidate) return;
      const candidate = event.candidate.toJSON();
      candidate.type = 'candidate';
      self._ws.send(JSON.stringify(candidate));
>>>>>>> .theirs
    };
<<<<<<< .mine
    const self = this;
    if (self.onaddstream) {
      pc.ontrack = (event) => {
        if (!self._client_id) return;
        if (this._is_multi) {
          if (event.streams[0].id === self._client_id) return;
        }
        self.onaddstream(event);
      };
    }
    if (this.onremovestream) pc.onremovestream = this.onremovestream;
=======
    if (self.onaddstream) {
      pc.ontrack = (event) => {
        if (!self._client_id) return;
        if (self._is_multi) {
          if (event.streams[0].id === self._client_id) return;
        }
        self.onaddstream(event);
      };
    }
    if (this.onremovestream) pc.onremovestream = this.onremovestream;

>>>>>>> .theirs
    if (this._stream) {
      this._stream.getTracks().forEach(track => pc.addTrack(track, this._stream));
    }
>>>>>>> .theirs
    return pc;
  }

  async _handleSdp(message, type) {
    await this._pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: message.sdp })).catch(console.log);
    const sdp = await this._pc.createAnswer({});
    await this._pc.setLocalDescription(sdp);
    this._ws.send(JSON.stringify({ type: type, sdp: this._pc.localDescription.sdp }));
  }

  async _answer(message) {
    const { config } = message;
    if (this.onlyTls) {
      const filtered = config.iceServers[0].urls.filter(v => v.startsWith('turns:'));
      config.iceServers[0].urls = filtered;
    }

    if (!this._isSafari) {
      const certificate = await RTCPeerConnection.generateCertificate({ name: 'ECDSA', namedCurve: 'P-256' });
      config.certificates = [certificate];
    }
    this._pc = this._createPeerConnection(config);
    this._handleSdp(message, 'answer');
  }
}
