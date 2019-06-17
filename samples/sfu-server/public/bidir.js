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

let streams = {};
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
    _clear: function () {
      [1, 2, 3].forEach((c) => {
        const elm = document.getElementById(`remoteVideo${c}`);
        if(elm.SrcObject) {
          elm.srcObject.getVideoTracks()[0].stop();
          elm.srcObject = null;
        }
      });
    },

    _closed: function () {
      const vm = this;
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
      }
      if (elmVideo.srcObject) elmVideo.srcObject = null;
      vm._clear();
      vm.state = 'ready';
      console.log('#### closed');
    },

    _update0: function () { // _update is reserved
      const vm = this;
      vm._clear();
      let cnt = 1;
      Object.keys(streams).forEach((key) => {
        const elmRVideo = document.getElementById(`remoteVideo${cnt}`);
        elmRVideo.srcObject = streams[key];
        cnt += 1;
      });
    },

    _streamadded: function (event) {
      const vm = this;
      const newstream = event.streams[0];
      newstream.onremovetrack = () => {
        if (newstream.id in streams) delete streams[newstream.id];
        vm._update0();
      };
      if (Object.keys(streams).length === 3) return;

      let isin = false;
      Object.keys(streams).forEach((key) => {
        if (key === newstream.id) isin = true;
      });
      if (isin) return;
      streams[newstream.id] = newstream;
      vm._update0();
    },

    disconnect: function () {
      const vm = this;
      vm._clear();
      if (sfu) sfu.disconnect();
      for (const m in streams) delete streams[m];
    },

    mbroad: debounce(async function (id) {
      const vm = this;
      try {
        const constraints = { video: { width: 1280, height: 720 }, audio: 'OPUS' };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        localStream = stream;
        elmVideo.srcObject = stream;

        const ret = await http.request({ method: 'post', url: '/ticket', data: { direction: 'up', room: id } });
        const ticket = ret.data;
        vm.message = ticket.id;
        console.log('#### ticket created -> open ', ticket.url);

        sfu = new SFUClient('up', ticket.id);
        sfu.onclose = vm._closed;
        sfu.onaddstream = vm._streamadded;
        sfu.setMedia({ codec_type: 'H264', bit_rate: 2000 }, { codec_type: 'OPUS' }, stream);
        sfu.connect(ret.data.url, ret.data.access_token, true);
        vm.state = 'connected';
      } catch (e) {
        vm.message = e;
        vm.state = 'ready';
      }
    }, 500), // debounce

    listRooms: async function () {
      const vm = this;
      vm.message = 'Connecting...';
      vm.rooms = [];

      try {
        const ret = await http.request({ method: 'get', url: '/list' });
        vm.rooms.length = 0;
        ret.data.rooms.forEach(r => vm.rooms.push({
          id: r.id,
          upCount: r.up_count,
          downCount: r.down_count,
        }));
        vm.state = 'listed';
        vm.message = `Room count: ${vm.rooms.length}`;
      } catch (e) {
        vm.message = e;
        vm.state = 'ready';
      }
    },
  },
});
