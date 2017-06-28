
# Javascript server-side backend/frontend sample code

This sample code is for backend and frontend written with express.

## backend

Application developers need to wrap SFU service APIs to hide client credentials from users by building a Web API server.

The example is written in app.js.
You need to implement additional user limitation for real world use case.

## frontend

Application developers need to write frontend codes.

The example is located in public directory.

## how to use

In this section, the example for local server is described.
Actually it may be necessary to build a server on the Internet.

### preparation

Set your client credentials in app.js.

```Javascript
L11: const CLIENT_ID = ""
L12: const CLIENT_SECRET = ""
```

You need to install npm in advance.

After run commands bellow, a web server start with port:3000.

```sh
# nmp install
# npm start
```

You can access to broadcasting page sample by
``http://localhost:3000/broadcast.html``

Push the broadcast button, you can start stream.

You can access to watching page sample by
``http://localhost:3000/watch.html``

Push the list button, you can start listing rooms.
