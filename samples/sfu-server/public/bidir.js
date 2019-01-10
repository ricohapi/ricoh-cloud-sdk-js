/* global axios, Vue, SFUClient */
/* eslint no-restricted-globals: ["error"] */
/**
 * Copyright (c) 2017 Ricoh Company, Ltd. All Rights Reserved.
 * See LICENSE for more information
 */

let sfu = null;
const elmVideo = document.getElementById('localVideo');
const pos = location.href.lastIndexOf('/');
const http = axios.create({ baseURL: location.href.substr(0, pos) });

const streams = {};
let localStream = null;

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

Vue.component('room-item', {
  props: ['room'],
  template: '<div>'
    + '<button v-on:click="$emit(\'mbroad\')">'
    + '<div v-bind:class="{onair:room.upCount > 0}">'
    + ' {{ room.id }} watch:{{ room.downCount }} </div>'
    + '</button>'
    + '</div>',
});

const app = new Vue({ // eslint-disable-line no-unused-vars
  el: '#app',
  data: {
    message: '',
    state: 'ready',
    rooms: [],
  },
  methods: {
    disconnect: function () {
      if (sfu) sfu.disconnect();
      [1, 2, 3].forEach((c) => {
        const elm = document.getElementById(`remoteVideo${c}`);
        elm.srcObject = null;
      });
    },
    mbroad: debounce(function (id) {
      const vm = this;
      console.log('#### start mbroadcast()');
      const constraints = { video: { width: 1280, height: 720 }, audio: true };
      navigator.mediaDevices.getUserMedia(constraints)
        .then((stream) => {
          console.log('#### getUserMedia() loaded');
          localStream = stream;
          elmVideo.srcObject = stream;
          return http.request({ method: 'post', url: '/ticket', data: { direction: 'up', room: id } });
        })
        .then((ret) => {
          vm.message = ret.data.id;
          console.log('#### ticket created -> open ', ret.data.url);
          sfu = new SFUClient('up', ret.data.id);

          const clear = () => {
            [1, 2, 3].forEach((c) => {
              const elm = document.getElementById(`remoteVideo${c}`);
              elm.srcObject = null;
            });
          };
          sfu.onclose = () => {
            if (localStream) {
              localStream.getTracks().forEach(track => track.stop());
              localStream = null;
            }
            if (elmVideo.src) elmVideo.srcObject = null;
            clear();

            vm.state = 'ready';
            console.log('#### closed');
          };
          const update = () => {
            clear();
            let cnt = 1;
            Object.keys(streams).forEach((key) => {
              const elmRVideo = document.getElementById(`remoteVideo${cnt}`);
              elmRVideo.srcObject = streams[key];
              cnt += 1;
            });
          };
          sfu.onremovestream = (event) => {
            if (event.stream.id in streams) delete streams[event.stream.id];
            update();
          };
          sfu.onaddstream = (event) => {
            const newstream = event.streams[0];

            if (Object.keys(streams).length === 3) return;

            let isin = false;
            Object.keys(streams).forEach((key) => {
              if (key === newstream.id) isin = true;
            });
            if (isin) return;
            streams[newstream.id] = newstream;

            update();
          };
          sfu.setMedia({ codec_type: 'VP9', bit_rate: 2000 }, { codec_type: 'OPUS' }, localStream);
          sfu.connect(ret.data.url, ret.data.access_token, true);
          vm.state = 'connected';
        })
        .catch((e) => {
          console.log(e);
          vm.message = JSON.stringify(e);
          vm.state = 'ready';
        });
    }, 500), // debounce
    listRooms: function () {
      const vm = this;
      vm.message = 'Connecting...';
      vm.rooms = [];

      http.request({ method: 'get', url: '/list' })
        .then((ret) => {
          ret.data.rooms.forEach(r => vm.rooms.push({
            id: r.id,
            upCount: r.up_count,
            downCount: r.down_count,
          }));
          vm.state = 'listed';
          vm.message = `Room count: ${vm.rooms.length}`;
        })
        .catch((e) => {
          vm.message = JSON.stringify(e);
          vm.state = 'ready';
        });
    },
  },
});
