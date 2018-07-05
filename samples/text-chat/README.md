
# Text Chat Sample

Study sample code to learn how to use Messaging API via RICOH Cloud SDK for JavaScript.

This code sample offers a back-end function and a front-end function. The sample uses Koa.

## Back-End

A back-end Web API server implementation which hides Client Credentials from front-end service users. The source code is located in `server.js`.

Note that this code sample aims to show the basic usage of the API and the SDK. If you want to publish this sample to offer your service, you should consider adding more user limitation to this implementation.

## Front-End

A front-end application for XMPP(BOSH). The source code is located in `public` directory.

## Requirements

- yarn

## How to Use

Download this code sample using `git clone`.

```sh
$ git clone https://github.com/ricohapi/ricoh-cloud-sdk-js.git
$ cd ricoh-cloud-sdk-js/samples/text-chat
```

Set your Client Credentials in `server.js`.

```javascript
L17: const CLIENT_ID = "<Set your Client ID here>";
L18: const CLIENT_SECRET = "<Set your Client Secret here>";
```

Run the following commands to start a web server on port 3000.


```sh
$ yarn
$ yarn start
```

## Step by Step guide
1. Open ``http://localhost:3000/signin`` in a web browser(support only Chrome or Firefox).

2. Login with *user_1*'s ricoh account.

3. Click ``CONNECT`` button.

4. Open ``http://localhost:3000/signin`` on another tab in the web browser.

5. Login with *user_2*'s ricoh account.

6. Click ``CONNECT`` button.

7. On ``Contacts`` panel, enter *user_1*'s sub and click ``SUBSCRIBE`` button.

8. Click ``CHAT`` on ``Contacts`` panel.

9. On ``Chat`` panel, enter the message to send to *user_2* and click ``SEND`` button. The message will be sent.

10. Click ``DISCONNECT`` button for disconnect.
