
# Video Chat Sample

Study sample code to learn how to use Peer-to-Peer Communication API via RICOH Cloud SDK for JavaScript.

This code sample offers a back-end function and a front-end function. The sample uses Express.

## Back-End

A back-end Web API server implementation which hides Client Credentials from front-end service users. The source code is located in `app.js`.

Note that this code sample aims to show the basic usage of the API. If you want to publish this sample to offer your service, you should consider adding more user limitation to this implementation.

## Front-End

A front-end application for WebRTC. The source code is located in public directory.

## Requirements

- npm

## How to Use

Download this code sample using `git clone`.

```sh
$ git clone https://github.com/ricohapi/ricoh-cloud-sdk-js.git
$ cd ricoh-cloud-sdk-js/samples/video-chat
```

Set your Client Credentials in `app.js`.

```javascript
L12: const CLIENT_ID = '<Set your Client ID here>';
L13: const CLIENT_SECRET = '<Set your Client Secret here>';
```

Run the following commands to start a web server on port 3000.

```sh
$ npm install --production
$ npm start
```

## Step by Step guide
1. Open ``http://localhost:3000/signin`` in a web browser(support only Chrome or Firefox).

2. Login with a RICOH account.

3. Click ``Make Offer`` button.

4. Select all ``Offer`` strings and copy to clipboard.

5. Open ``http://localhost:3000/signin`` on another tab in the web browser.

6. Paste ``Offer`` string to ``Offer`` area.

7. Click ``Receive Offer`` button.

8. Select all ``Answer`` strings and copy to clipboard.

9. Back to the first tab.

10. Paste ``Answer`` string to ``Answer`` area.

11. Click ``Receive Answer`` button.



