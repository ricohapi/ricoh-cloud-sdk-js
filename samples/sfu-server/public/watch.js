/* global ThetaView, axios, Vue, SFUClient */
/**
 * Copyright (c) 2017 Ricoh Company, Ltd. All Rights Reserved.
 * See LICENSE for more information
 */

let sfu = null;
const thetaview = new ThetaView();
const elmWrapper = document.getElementById('wrapper');
const elmVideo = document.getElementById('remoteVideo');
const pos = location.href.lastIndexOf('/');
const http = axios.create({ baseURL: location.href.substr(0, pos) });

function debounce (fn, delay) {
  let tid = null;
  return function () {
    clearTimeout(tid);
    const args = arguments;
    const self = this;
    tid = setTimeout(() => {
      fn.apply(self, args);
    }, delay);
  }
}

Vue.component('room-item', {
  props: ['room'],
  template: '<div>' +
    '<button v-on:click="$emit(\'con\')">' +
    '<div v-bind:class="{onair:room.upCount > 0}">' +
    ' {{ room.id }} watch:{{ room.downCount }} </div>' +
    '</button>' +
    '<button v-on:click="$emit(\'del\')">Del</button>' +
    '</div>',
});

const app = new Vue({
  el: '#app',
  data: {
    message: '',
    state: 'ready',
    rooms: [],
    thetamode: false,
  },
  methods: {
    thetaon: function() {
      thetaview.setContainer(elmWrapper);
      thetaview.start(elmVideo);
      this.thetamode = true;
    },
    thetaoff: function() {
      thetaview.stop(elmVideo);
      this.thetamode = false;
    },
    disconnect: function() {
      if (sfu) sfu.disconnect();
    },
    remove: debounce(function(id) {
      const vm = this;
      http.request({ method: 'delete', url: '/room', data: { room: id } })
        .then((ret) => {
          vm.listRooms();
        })
        .catch((e) => {
          vm.message = JSON.stringify(e);
          vm.state = 'ready';
        });
    }, 500),
    watch: function(id) {
      const vm = this;
      console.log('#### start watch() -> ticket ', id);

      http.request({ method: 'post', url: '/ticket', data: { direction: 'down', room: id } })
        .then((ret) => {
          console.log('#### ticket created -> open ', ret.data.url);
          sfu = new SFUClient('down', ret.data.id);
          sfu.onclose = () => {
            vm.state = 'listed';
            console.log('#### closed');
            if (!elmVideo.srcObject) return;
            thetaview.stop(elmVideo);
            vm.thetamode = false;
            elmVideo.srcObject = null;
          };
          sfu.onaddstream = (event) => {
            elmVideo.srcObject = event.streams[0];
          };
          sfu.setMedia({ codec_type: 'VP9' }, { codec_type: 'OPUS' });
          sfu.connect(ret.data.url, ret.data.access_token);
          vm.state = 'connected';
        })
        .catch((e) => {
          vm.message = JSON.stringify(e);
          vm.state = 'ready';
        });
    },
    listRooms: function() {
      const vm = this;
      vm.message = 'Connecting...';
      vm.rooms = [];

      http.request({ method: 'get', url: '/list' })
        .then((ret) => {
          ret.data.rooms.forEach(r => vm.rooms.push({
            id: r.id,
            upCount: r.up_count,
            downCount: r.down_count
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