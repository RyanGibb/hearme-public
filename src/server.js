
const bodyParser = require('body-parser');

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
    languageCode: 'en-US',
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
