
const bodyParser = require('body-parser');
const nexmo = require('nexmo');
const path = require('path')

//TODO add this to websocket lol
//bodyParser.urlencoded({ extended: true})
//bodyParser.json()

//----------------------------------------------------------------------------
//                             Google speech to text stuff
//----------------------------------------------------------------------------

async function speechToText() {
  // Imports the Google Cloud client library
  const speech = require('@google-cloud/speech');
  const fs = require('fs');

  // Creates a client
  const client = new speech.SpeechClient();

  // The name of the audio file to transcribe
  const fileName = 'audio.raw';

  // Reads a local audio file and converts it to base64
  const file = fs.readFileSync(fileName);
  const audioBytes = file.toString('base64');

  // The audio file's encoding, sample rate in hertz, and BCP-47 language code
  const audio = {
    content: audioBytes,
  };
  const config = {
    encoding: 'LINEAR16',
    sampleRateHertz: 16000,
    languageCode: 'en-UK',
  };
  const request = {
    audio: audio,
    config: config,
  };

  // Detects speech in the audio file
  const [response] = await client.recognize(request);
  const transcription = response.results
    .map(result => result.alternatives[0].transcript)
    .join('\n');
  console.log(`Transcription: ${transcription}`);
}
//----------------------------------------------------------------------------
//                              HTTP Server
//----------------------------------------------------------------------------

const express = require('express');
const http = require('http');

let port = 8080;
const app = express();
const httpServer = http.createServer(app);

httpServer.listen(port, function () {
  console.log('Listening for HTTP requests on port: ' + port);
});

// Serve static files, such as css and scripts, from the directory below.
app.use(express.static(__dirname + '/frontend/my-app/dist/my-app/'));

app.get('/nexmo_event', function (req, res) {
  console.log("Nexmo event: " + req);
});

// app.get('/', function(req, res) {
//     res.sendFile(path.resolve('./frontend/my-app/dist/my-app/index.html'));
// });
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
