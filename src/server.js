
const bodyParser = require('body-parser');
const nexmo = require('nexmo');

//TODO add this to websocket lol
//bodyParser.urlencoded({ extended: true})
//bodyParser.json()



//----------------------------------------------------------------------------
//                              HTTP Server
//----------------------------------------------------------------------------

const express = require('express');
const http = require('http');

let port = 5000;
const app = express();
const httpServer = http.createServer(app);

httpServer.listen(port, function () {
  console.log('Listening for HTTP requests on port: ' + port);
});

// Serve static files, such as css and scripts, from the directory below.
app.use(express.static(__dirname + '/static_files'));

//----------------------------------------------------------------------------
//                              WebSocket Server
//----------------------------------------------------------------------------

const ws = require('ws');

const wsServer = new ws.Server({server: httpServer});

wsServer.on('connection', function(ws, req) {
  wsMsgLog('WS connection ', req, '');

  ws.on('close', function(code, msg) {
    console.log('WS disconnection ' + ws._socket.remoteAddress + ':'
        + req.connection.remotePort + ' Code ' + code);
  });

  ws.on('message', function(data) {
    let msgString = data.toString();
    wsMsgLog('WS -> rx ', req, msgString);
    try {
      var receivedMessage = JSON.parse(messageString);
    }
    catch(error) {
      respondError(ws, req, 'error parsing JSON request', error);
      return;
    }

    // TODO process message

  })
});

function respondError(ws, req, human_readable_error, error) {
  let responce = 'error';
  responceMessage = {responce, human_readable_error, error};
  respond(ws, req, responceMessage);
}

function respond(ws, req, msg) {
  var msgString = JSON.stringify(msg);
  ws.send(msgString);
  wsLog('WS <- tx ', req, msgString);
};

const lenLog = 200;

function wsMsgLog(prefix, req, msg) {
  console.log(prefix + req.connection.remoteAddress + ':' + req.connection.remotePort + ' ' +
    (msg.length > lenLog ? msg.slice(0, lenLog) + "..." : msg)
  );
}
