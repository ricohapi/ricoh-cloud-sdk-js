/* global ThetaView, axios, Vue, SFUClient */
/* eslint no-restricted-globals: ["error"] */
/**
 * Copyright (c) 2018 Ricoh Company, Ltd. All Rights Reserved.
 * See LICENSE for more information
 */

let sfu = null;
const thetaview = new ThetaView();
const elmWrapper = document.getElementById('wrapper');
const elmVideo = document.getElementById('remoteVideo');
const pos = location.href.lastIndexOf('/');
const http = axios.create({ baseURL: location.href.substr(0, pos) });

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
    + '<button v-on:click="$emit(\'con\')">'
    + '<div v-bind:class="{onair:room.upCount > 0}">'
    + ' {{ room.id }} watch:{{ room.downCount }} </div>'
    + '</button>'
    + '<button v-on:click="$emit(\'del\')">Del</button>'
    + '</div>',
});

const app = new Vue({ // eslint-disable-line no-unused-vars
  el: '#app',
  data: {
    message: '',
    state: 'ready',
    rooms: [],
    thetamode: false,
  },
  methods: {
    thetaon: function () {
      thetaview.setContainer(elmWrapper);
      thetaview.start(elmVideo);
      this.thetamode = true;
    },
    thetaoff: function () {
      thetaview.stop(elmVideo);
      this.thetamode = false;
    },
    disconnect: function () {
      if (sfu) sfu.disconnect();
    },
    remove: debounce(async function (id) {
      const vm = this;
      try {
        await http.request({ method: 'delete', url: '/room', data: { room: id } });
        vm.listRooms();
      } catch (e) {
        vm.message = e;
        vm.state = 'ready';
      }
    }, 500),

    _closed: function () {
      const vm = this;
      vm.state = 'listed';
      console.log('#### closed');
      if (!elmVideo.srcObject) return;
      thetaview.stop(elmVideo);
      vm.thetamode = false;
      elmVideo.srcObject = null;
    },

    watch: async function (id) {
      const vm = this;
      console.log('#### start watch() -> ticket ', id);
      try {
        const ret = await http.request({ method: 'post', url: '/ticket', data: { direction: 'down', room: id } });
        const ticket = ret.data;
        console.log('#### ticket created -> open ', ticket.url);

        sfu = new SFUClient('down', ticket.id);
        sfu.onclose = vm._closed;
        sfu.onaddstream = ({ streams }) => {
          [elmVideo.srcObject] = streams;
        };
        sfu.setMedia({ codec_type: 'H264' }, { codec_type: 'OPUS' });
        sfu.connect(ticket.url, ticket.access_token);
        vm.state = 'connected';
      } catch (e) {
        vm.message = e;
        vm.state = 'ready';
      }
    },

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
