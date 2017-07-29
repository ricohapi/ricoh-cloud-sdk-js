# RICOH Cloud SDK for JavaScript

JavaScript client library for RICOH Cloud API.

## Client-Side SDK Usage

/src/sfu/sfucssdk.js

### Broadcast

Initialize with ```<Room ID>```.

Set close handler if you want.

Set audio/video codecs and `stream` got from getUserMedia().

```javascript
const sfu = new SFUCSSDK('up', <Room ID>);
sfu.onclose = () => {
  // do anything
};
sfu.setMedia({ codec_type: 'VP9', bit_rate: 1000 }, { codec_type: 'OPUS' }, stream);
```
You call connect() method, broadcasting will be started.

```javascript
sfu.connect(<URL>, <Access Token>);
```

### Watch

Initialize with ```<Room ID>```.

Set close handler if you want.

Set onaddstream for remote stream handle with DOM.

Set audio/video codecs and `stream` got from getUserMedia().

```javascript
const sfu = new SFUCSSDK('down', <Room ID>);
sfu.onclose = () => {
  // do anything
};
sfu.onaddstream = event => {
  // handle window.URL.createObjectURL(event.stream);
};
sfu.setMedia({ codec_type: 'VP9' }, { codec_type: 'OPUS' });
```

You call connect() method, watching will be started.

```javascript
sfu.connect(<URL>, <Access Token>);
```

### Disconnect

```javascript
sfu.disconnect();
```

## Sample Codes

- [SFU Sample Code](./samples/sfu-server/)

## See Also

* [RICOH Cloud API Developer Guide](https://api.ricoh/docs/ricoh-cloud-api/)
