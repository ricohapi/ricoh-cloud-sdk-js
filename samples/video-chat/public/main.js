/**
 * Copyright (c) 2017 Ricoh Company, Ltd. All Rights Reserved.
 * See LICENSE for more information
 */

let pc = null;
let mediaStream = null;

var app = new Vue({
  el: '#app',
  data: {
    offer: '',
    answer: '',
    user: '',
    token: '',
    state: 'initial'
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
    makePeerConnection: function() {
      let ice = {};
      if (this.user && this.token) {
        ice = {
          'iceServers': [{
            'url': 'turn:turn.api.ricoh:3478',
            'credential': this.token,
            'username': this.user,
          }],
          'iceTransportPolicy': 'relay',
        };
        const ua = window.navigator.userAgent.toLowerCase();
        if (ua.indexOf('chrome') != -1) ice['iceTransports'] = 'relay';
      } else {
        ice = { 'iceServers': [] };
      }
      pc = new RTCPeerConnection(ice);
      pc.onaddstream = (event) => {
        const videoElm_r = document.getElementById('remoteVideo');
        videoElm_r.srcObject = event.stream;
      };
      return pc;
    },

    makeOffer: async function() {
      const self = this;
      try {
        pc = self.makePeerConnection();
        pc.onicecandidate = (event) => {
          if (event.candidate) return;
          self.offer = pc.localDescription.sdp;
          self.state = 'offer';
        };
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        const videoElm = document.getElementById('localVideo');
        videoElm.srcObject = mediaStream;
        pc.addStream(mediaStream);

        const offerSdp = await pc.createOffer();
        await pc.setLocalDescription(offerSdp);
      } catch (e) {
        console.error(e);
      }
    },
    makeAnswer: async function() {
      const self = this;
      try {
        pc = self.makePeerConnection();
        pc.onicecandidate = (event) => {
          if (event.candidate) return;
          self.answer = pc.localDescription.sdp;
          self.state = 'answer';
          self.offer = '';
        };
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        const videoElm = document.getElementById('localVideo');
        videoElm.srcObject = mediaStream;
        pc.addStream(mediaStream);

        await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: this.offer }));
        const answerSdp = await pc.createAnswer();
        await pc.setLocalDescription(answerSdp);
      } catch (e) {
        console.error(e);
      }
    },
    receiveAnswer: async function() {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: this.answer }));
        this.state = 'connected';
        this.answer = '';
        this.offer = '';
      } catch (e) {
        console.error(e);
      }
    },
    disconnect: function() {
      if (pc) {
        pc.removeStream(mediaStream);
        pc.close();
        pc = null;
      }
      window.location.href = 'http://localhost:3000/signin';
    }
  }
});