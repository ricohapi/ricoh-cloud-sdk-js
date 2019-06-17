/* global axios, Vue, SFUClient */
/* eslint no-restricted-globals: ["error"] */
/**
 * Copyright (c) 2017 Ricoh Company, Ltd. All Rights Reserved.
 * See LICENSE for more information
 */

const elmVideo = document.getElementById('localVideo');
const pos = location.href.lastIndexOf('/');
const http = axios.create({ baseURL: location.href.substr(0, pos) });

let localStream = null;
let sfu = null;

function debounce(fn, delay) {
  let tid = null;
  return function (...args) {
    clearTimeout(tid);
    const self = this;
    tid = setTimeout(() => {
      fn.apply(self, args);
    }, delay);
  };
}

const app = new Vue({ // eslint-disable-line no-unused-vars
  el: '#app',
  data: {
    message: ' ',
    state: 'ready',
  },
  methods: {
    _closed: function () {
      const vm = this;
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
      }
      if (elmVideo.srcObject) elmVideo.srcObject = null;
      vm.message = 'closed';
      vm.state = 'ready';
      console.log('#### closed');
    },

    disconnect: function () {
      const vm = this;
      if (sfu) sfu.disconnect();
      vm.message = 'disconnected';
      vm.state = 'ready';
    },

    broadcast: debounce(async function () {
      const vm = this;
<<<<<<< .mine
      try {
        const constraints = { video: { width: 1280, height: 720 }, audio: 'OPUS' };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        localStream = stream;
        elmVideo.srcObject = stream;

        const ret = await http.request({ method: 'post', url: '/ticket', data: { direction: 'up' } });
        const ticket = ret.data;
        vm.message = ticket.id;
        console.log('#### ticket created -> open ', ticket.url);

        sfu = new SFUClient('up', ticket.id);
        sfu.onclose = vm._closed;
        sfu.setMedia({ codec_type: 'H264', bit_rate: 2000 }, { codec_type: 'OPUS' }, stream);
        sfu.connect(ticket.url, ticket.access_token);
        vm.state = 'connected';
      } catch (e) {
        vm.message = e;
        vm.state = 'ready';
      }














=======
      console.log('#### start broadcast()');
      const constraints = { video: { width: 1280, height: 720 }, audio: false };
      navigator.mediaDevices.getUserMedia(constraints)
        .then((stream) => {
          console.log('#### getUserMedia() loaded');
          localStream = stream;
          elmVideo.srcObject = stream;
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
            if (elmVideo.srcObject) {
              elmVideo.srcObject = null;
            }
            vm.state = 'ready';
            vm.message = 'closed';
            console.log('#### closed');
          };
          sfu.setMedia({ codec_type: 'VP9', bit_rate: 2000 }, { codec_type: 'OPUS' }, localStream);
          sfu.connect(ret.data.url, ret.data.access_token);
          vm.state = 'connected';
        })
        .catch((e) => {
          console.log(e);
          vm.message = JSON.stringify(e);
          vm.state = 'ready';
        });
>>>>>>> .theirs
    }, 500), // debounce
  },
});
