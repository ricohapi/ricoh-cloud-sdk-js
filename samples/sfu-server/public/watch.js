/* global ThetaView, axios, Vue, SFUClient */
/**
 * Copyright (c) 2017 Ricoh Company, Ltd. All Rights Reserved.
 * See LICENSE for more information
 */

let sfu = null;
const thetaview = new ThetaView();
const elmWrapper = document.getElementById('wrapper');
const elmVideo = document.getElementById('remoteVideo');
const http = axios.create({ baseURL: 'http://localhost:3000' });

Vue.component('room-item', {
  props: ['room'],
  template: '<div>' +
    '<button v-on:click="$emit(\'con\')">' +
    '<div v-bind:class="{onair:room.upCount > 0}">' +
    ' {{ room.id }} watch:{{ room.downCount }} </div>' +
    '</button>' +
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
    watch: function (id) {
      const vm = this;
      console.log('#### start watch() -> ticket ', id);

      http.request({ method: 'post', url: '/ticket', data: { direction: 'down', room: id } })
        .then((ret) => {
          console.log('#### ticket created -> open ', ret.data.url);
          sfu = new SFUClient('down', ret.data.id);
          sfu.onclose = () => {
            vm.state = 'listed';
            console.log('#### closed');
            if (!elmVideo.src) return;
            thetaview.stop(elmVideo);
            vm.thetamode = false;
            window.URL.revokeObjectURL(elmVideo.src);
            elmVideo.src = null;
          };
          sfu.onaddstream = (event) => {
            elmVideo.src = window.URL.createObjectURL(event.stream);
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
    listRooms: function () {
      const vm = this;
      vm.message = 'Connecting...';
      vm.rooms = [];

      http.request({ method: 'get', url: '/list' })
        .then((ret) => {
          ret.data.rooms.forEach(r => vm.rooms.push({
            id: r.id,
            upCount: r.up_count,
            downCount: r.down_count }));
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
