# SFU Sample Code

Study sample code to learn how to use WebRTC SFU API via RICOH Cloud SDK for JavaScript.

This code sample offers a back-end function and a front-end function. The sample uses Express.

## Back-End

A back-end Web API server implementation which hides Client Credentials from front-end service users. The source code is located in `app.js`.

Note that this code sample aims to show the basic usage of the API and the SDK. If you want to publish this sample to offer your service, you should consider adding more user limitation to this implementation.

## Front-End

A front-end application for WebRTC. The source code is located in `public` directory.

## Requirements

* npm

## How to Use

Download this code sample using `git clone`.

```sh
$ git clone https://github.com/ricohapi/ricoh-cloud-sdk-js.git
$ cd ricoh-cloud-sdk-js/sfu-server
```

Set your Client Credentials in `app.js`.

```javascript
L11: const CLIENT_ID = ""
L12: const CLIENT_SECRET = ""
```

Run the following commands to start a web server on port 3000.

```sh
$ nmp install
$ npm start
```

Open `http://localhost:3000/broadcast.html` in your browser.

Push the "broadcast" button to start broadcasting.

Open `http://localhost:3000/watch.html` in another window.

Push the "list" button to see currently available rooms and select a room to start watching the broadcast.
