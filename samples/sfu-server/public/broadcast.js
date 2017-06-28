/* global axios, Vue, SFUClient */
/**
 * Copyright (c) 2017 Ricoh Company, Ltd. All Rights Reserved.
 * See LICENSE for more information
 */

const elmVideo = document.getElementById('localVideo');
const http = axios.create({ baseURL: 'http://localhost:3000' });
let localStream = null;
let sfu = null;

const app = new Vue({
  el: '#app',
  data: {
    message: ' ',
    state: 'ready',
    cameras: [],
  },
  methods: {
    disconnect: function () {
      if (sfu) sfu.disconnect();
      this.message = 'disconnected.';
    },
    broadcast: function () {
      const vm = this;
      console.log('#### start broadcast()');
      const constraints = { video: { width: 1280, height: 720 }, audio: true };
      navigator.mediaDevices.getUserMedia(constraints)
        .then((stream) => {
          console.log('#### getUserMedia() loaded');
          localStream = stream;
          elmVideo.src = window.URL.createObjectURL(stream);
          return http.request({ method: 'post', url: '/ticket', data: { direction: 'up' } });
        })
        .then((ret) => {
          vm.message = ret.data.id;
          console.log('#### ticket created -> open ', ret.data.url);
          sfu = new SFUClient('up', ret.data.id);
          sfu.onclose = () => {
            if (localStream) {
              localStream.getTracks().forEach(track => track.stop());
              localStream = null;
            }
            if (elmVideo.src) {
              window.URL.revokeObjectURL(elmVideo.src);
              elmVideo.src = null;
            }
            vm.state = 'ready';
            console.log('#### closed');
          };
          sfu.setMedia({ codec_type: 'VP9', bit_rate: 1000 }, { codec_type: 'OPUS' }, localStream);
          sfu.connect(ret.data.url, ret.data.access_token);
          vm.state = 'connected';
        })
        .catch((e) => {
          console.log(e);
          vm.message = JSON.stringify(e);
          vm.state = 'ready';
        });
    },
  },
});
