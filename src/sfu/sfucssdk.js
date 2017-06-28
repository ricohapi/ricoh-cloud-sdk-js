/**
 * Copyright (c) 2017 Ricoh Company, Ltd. All Rights Reserved.
 * See LICENSE for more information
 */

const RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection;
const RTCSessionDescription = window.RTCSessionDescription;

class SFUCSSDK {
  constructor(dir, id) {
    this._ws = null;
    this._pc = null;

    this._video = null;
    this._audio = null;
    this._stream = null;

    this._id = id;
    this._role = dir == 'down' ? 'downstream' : 'upstream';

    // for caller
    this.onclose = null;
    this.onaddstream = null;
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

  connect(url, token) {
    this._ws = new WebSocket(url);
    this._ws.onopen = () => {
      this._ws.send(JSON.stringify({
        type: 'connect',
        video: this._video,
        audio: this._audio,
        role: this._role,
        metadata: { access_token: token },
        channel_id: this._id,
      }));
    };
    this._ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type == 'offer') this._answer(message);
      else if (message.type == 'ping') this._ws.send(JSON.stringify({ type: 'pong' }));
    };
    this._ws.onclose = (event) => {
      if (this._pc) {
        this._pc.close();
        this._pc = null;
      }
      if (this._ws && this._ws.readyState < this._ws.CLOSING) {
        this._ws.close();
        this._ws = null;
      }
      if (this.onclose) this.onclose();
    };
  }

  _createPeerConnection(config) {
    const pc = new RTCPeerConnection(config);
    pc.onclose = console.log;
    pc.onerror = console.error;
    pc.oniceconnectionstatechange = console.log;
    pc.onicecandidate = (event) => {
      if (!event.candidate) return;
      const candidate = event.candidate.toJSON();
      candidate.type = 'candidate';
      this._ws.send(JSON.stringify(candidate));
    };
    if (this.onaddstream) pc.onaddstream = this.onaddstream;
    if (this._stream) pc.addStream(this._stream);
    return pc;
  }

  async _answer(message) {
    const config = message.config;
    const certificate = await RTCPeerConnection.generateCertificate({ name: 'ECDSA', namedCurve: 'P-256' });
    config.certificates = [certificate];
    this._pc = this._createPeerConnection(config);
    await this._pc.setRemoteDescription(new RTCSessionDescription(message));
    const sdp = await this._pc.createAnswer({});
    await this._pc.setLocalDescription(sdp);
    this._ws.send(JSON.stringify({ type: 'answer', sdp: this._pc.localDescription.sdp }));
  }
}
