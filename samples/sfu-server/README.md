# Live Streaming Sample

Study sample code to learn how to use Live Streaming API via RICOH Cloud SDK for JavaScript.

This code sample offers a back-end function and a front-end function. The sample uses Express.

## Back-End

A back-end Web API server implementation which hides Client Credentials from front-end service users.

Note that this code sample aims to show the basic usage of the API and the SDK. If you want to publish this sample to offer your service, you should consider adding more user limitation to this implementation.

## Front-End

A front-end application for WebRTC. The source code is located in `public` directory.

## Requirements

* yarn

## How to Use

Download this code sample using `git clone`.

```sh
$ git clone https://github.com/ricohapi/ricoh-cloud-sdk-js.git
$ cd ricoh-cloud-sdk-js/samples/sfu-server
```

Set your Client Credentials as envinonment variables.

```sh
$ export RDC_CLIENT_ID=<your client id>
$ export RDC_CLIENT_SECRET=<your client secret>
```

Run the following commands to start a web server on port 3000.

```sh
$ yarn
$ yarn start
```

Open `http://localhost:3000/broadcast.html` in your browser.

Push the "broadcast" button to start broadcasting.

Open `http://localhost:3000/watch.html` in another window.

Push the "list" button to see currently available rooms and select a room to start watching the broadcast.
