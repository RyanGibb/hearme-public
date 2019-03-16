
const bodyParser = require('body-parser');

//TODO add this to websocket lol
//bodyParser.urlencoded({ extended: true})
//bodyParser.json()



//----------------------------------------------------------------------------
//                              HTTP Server
//----------------------------------------------------------------------------

const express = require('express');
const http = require('http');
const httpServer = http.createServer(app);

httpServer.listen(port, function () {
  console.log('Listening for HTTP requests on port: ' + port);
});

let app = express();

var server = app.listen(5000, () => {
    console.log('Server is running..');
});

// Serve static files, such as css and scripts, from the directory below.
app.use(express.static(__dirname + '/static_files'));

//----------------------------------------------------------------------------
//                              WebSocket Server
//----------------------------------------------------------------------------

const ws = require('ws');

const maxLogMessageLength = 200;

const wsServer = new ws.Server({server: httpServer});

wsServer.on('connection', function(ws, req) {
  console.log('WS connection ' + req.connection.remoteAddress + ':'
      + req.connection.remotePort);

  ws.on('close', function(code, message) {
    console.log('WS disconnection ' + ws._socket.remoteAddress + ':'
        + req.connection.remotePort + ' Code ' + code);
  });

  ws.on('message', function(data) {
    let messageString = data.toString();
    console.log('WS -> rx ' + req.connection.remoteAddress + ':' + req.connection.remotePort + ' ' +
        (messageString.length > maxLogMessageLength ? messageString.slice(0, maxLogMessageLength) + "..." : messageString)
    );

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

function respond(ws, req, responseMessage) {
  var messageString = JSON.stringify(responseMessage);
  ws.send(messageString);
  console.log('WS <- tx ' + req.connection.remoteAddress + ':' + req.connection.remotePort + ' ' +
    (messageString.length > maxLogMessageLength ? messageString.slice(0, maxLogMessageLength) + "..." : messageString)
  );
};
