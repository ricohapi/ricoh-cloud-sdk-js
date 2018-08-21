# RICOH Cloud SDK for JavaScript

JavaScript client library for RICOH Cloud API.

## Installation

```sh
$ git clone https://github.com/ricohapi/ricoh-cloud-sdk-js.git
$ copy ricoh-cloud-sdk-js/src/sfu/sfusdk.js /path/to/your-application
```

## SDK Usage

### WebRTC SFU

#### Broadcast Videos

Initialize `SFUClient` with ```<Room ID>```.

```javascript
const sfu = new SFUClient('up', <Room ID>);
```

Use `setMedia` to set audio/video codecs and `stream` obtained with `getUserMedia()`. You can also set a handler for close events with `onclose`.

```javascript
sfu.setMedia({ codec_type: 'VP9', bit_rate: 1000 }, { codec_type: 'OPUS' }, stream);
sfu.onclose = () => {
  // Do something.
};
```

Call `connect()` to start broadcasting.

```javascript
sfu.connect(<URL>, <Access Token>);
```

#### Watch Videos

Initialize `SFUClient` with ```<Room ID>```.

```javascript
const sfu = new SFUClient('down', <Room ID>);
```

Use `onaddstream` to set a remote stream object to your media and use `setMedia` to set audio/video codecs. You can also set a handler for close events with `onclose`.

```javascript
sfu.onaddstream = event => {
  // Set event.streams[0] to the srcObject attribute of your media.
};
sfu.setMedia({ codec_type: 'VP9' }, { codec_type: 'OPUS' });
sfu.onclose = () => {
  // Do something.
};
```

Call `connect()` to start watching videos.

```javascript
sfu.connect(<URL>, <Access Token>);
```

#### Stop Broadcasting / Watching Videos

Use `disconnect()` to stop broadcasting or watching videos.

```javascript
sfu.disconnect();
```

## Sample Codes

- [Live Streaming Sample](./samples/sfu-server/)

## See Also

* [RICOH Cloud API Developer Guide](https://api.ricoh/docs/ricoh-cloud-api/)
