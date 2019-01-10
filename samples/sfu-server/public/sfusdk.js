/**
 * Copyright (c) 2017 Ricoh Company, Ltd. All Rights Reserved.
 * See LICENSE for more information
 */

class SFUClient { // eslint-disable-line no-unused-vars
  constructor(dir, id, onlyTls=false) {
    this._ws = null;
    this._pc = null;

    this._video = null;
    this._audio = null;
    this._stream = null;

    this._id = id;
    this._role = dir === 'down' ? 'downstream' : 'upstream';
    this._client_id = '';
    this._is_multi = false;

    // for caller
    this.onclose = null;
    this.onaddstream = null;
    this.onremovestream = null;
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
  }

  connect(url, token, multi = false) {
    this._is_multi = multi;
    this._ws = new WebSocket(url);
    const msg = {
      type: 'connect',
      video: this._video,
      audio: this._audio,
      role: this._role,
      metadata: { access_token: token },
      channel_id: this._id,
      multistream: this._is_multi,
    };
    this._ws.onopen = () => {
      this._ws.send(JSON.stringify(msg));
    };
    this._ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.client_id) this._client_id = message.client_id;
      if (message.type === 'offer') this._answer(message);
      else if (message.type === 'update') this._update(message);
      else if (message.type === 'ping') this._ws.send(JSON.stringify({ type: 'pong' }));
    };
    this._ws.onclose = () => {
      if (this._pc) {
        this._pc.close();
        this._pc = null;
      }
      if (this._ws) {
        this._ws.close();
        this._ws = null;
      }
      if (this.onclose) this.onclose();
    };
  }

  _createPeerConnection(config) {
    const self = this;
    const pc = new RTCPeerConnection(config);
    pc.onclose = console.log;
    pc.onerror = console.error;
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
    pc.onicecandidate = (event) => {
      if (!event.candidate) return;
      const candidate = event.candidate.toJSON();
      candidate.type = 'candidate';
      self._ws.send(JSON.stringify(candidate));
    };
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
    if (this._stream) {
      this._stream.getTracks().forEach(track => pc.addTrack(track, this._stream));
    }
    return pc;
  }

  async _answer(message) {
    const { config } = message;
    if(this.onlyTls) {
      const filtered = config.iceServers[0].urls.filter( v => {return v.startsWith('turns:')});
      config.iceServers[0].urls = filtered;
    }
    const certificate = await RTCPeerConnection.generateCertificate({ name: 'ECDSA', namedCurve: 'P-256' });
    config.certificates = [certificate];
    this._pc = this._createPeerConnection(config);
    await this._pc.setRemoteDescription(new RTCSessionDescription(message)).catch(console.log);
    const sdp = await this._pc.createAnswer({});
    await this._pc.setLocalDescription(sdp);
    this._ws.send(JSON.stringify({ type: 'answer', sdp: this._pc.localDescription.sdp }));
  }

  async _update(message) {
    await this._pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: message.sdp })).catch(console.log);
    const sdp = await this._pc.createAnswer({});
    await this._pc.setLocalDescription(sdp);
    this._ws.send(JSON.stringify({ type: 'update', sdp: this._pc.localDescription.sdp }));
  }
}
