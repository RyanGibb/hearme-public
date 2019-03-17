
//----------------------------------------------------------------------------
//                             Google Speech to Text
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

//----------------------------------------------------------------------------
//                             Nexmo
//----------------------------------------------------------------------------

const url = 'https://sound-machine-234713.appspot.com/';

const Nexmo = require('nexmo');

const seamus = '447955753134';
const ryan = '447751580894';
const george = '447543507436';

const FROM_NUMBER = '447418343240';
const ANSWER_PATH = '/nexmo_answer';
const EVENT_PATH = '/nexmo_event';
const DEFAULT_VOICE = 'Chipmunk';

const START_TEXT = 'This is an system for the hearing impaired to be able to '
                    + 'communicate over the phone through a web interface. '
                    + 'Visit ' + url;

const nexmo = new Nexmo({
  apiKey: '***REMOVED***',
  apiSecret: '***REMOVED***',
  applicationId: '***REMOVED***',
  privateKey:'private.key',
}, {
  //debug: true
});

app.get(EVENT_PATH, function (req, res) {
  console.log('Nexmo event: ' + req);
});

// Make a phone call, returns the call uuid
function call(to_number, message, callback) {
  nexmo.calls.create({
      to: [{type: 'phone', number: to_number}],
      from: {type: 'phone', number: FROM_NUMBER},
      //answer_url: [url + ANSWER_PATH],
      ncco: [
        {
          'action': 'talk',
          'text': message
        },
        {
          'action': 'conversation',
          'name': to_number,
          'record': 'true'
        }
      ],
      event_url: [url + EVENT_PATH]
    },
    function (err, res) {
      if(err) {
        console.error(err);
        callback(err)
      }
      else {
        console.log(res);
        callback(null, res.uuid);
      }
    }
  );
}

function speak(uuid, text, callback) {
  nexmo.calls.talk.start(uuid, { text: text, voice_name: DEFAULT_VOICE }, callback);
}

function hangup(uuid, callback) {
  nexmo.calls.update(callId, { action: 'hangup' }, callback);
}


// call(ryan, "the quick brown fox jumped over the lazy dog", function(error, uuid) {
//   if(error) {
//     console.log("TEST ERROR CALL " + JSON.stringify(error));
//   }
//   else {
//     setTimeout(function() {
//       speak(uuid, "white apple",
//         function(error, res) {
//           if(error) {
//             console.log("TEST ERROR SPEAK " + JSON.stringify(error));
//           }
//           else {
//             console.log("TEST SPEAK RESPONSE " + JSON.stringify(res));
//           }
//         }
//       )
//     }, 8000);
//   }
// })

//----------------------------------------------------------------------------
//                              WebSocket Server
//----------------------------------------------------------------------------

const ws = require('ws');

const wsServer = new ws.Server({server: httpServer});

wsServer.on('connection', function(ws, req) {
  wsLog('WS connection ', req, '');

  ws.on('close', function(code, msg) {
    console.log('WS disconnection ' + ws._socket.remoteAddress + ':'
        + req.connection.remotePort + ' Code ' + code);
  });

  ws.on('message', function(data) {
    let msgString = data.toString();
    wsLog('WS -> rx ', req, msgString);
    try {
      var msg = JSON.parse(msgString);
    }
    catch(error) {
      respondError(ws, req, 'error parsing JSON request', error);
      return;
    }

    if (msg.request == 'call') {
      if (!msg.message) {
        msg.message = START_MESSAGE;
      }
      call(msg.number, msg.message, function(error, uuid) {
        if (error) {
          respondError(ws, req, "error calling number", error);
        } else {
          let response = "call";
          let message = { response, uuid };
          respond(ws, req, message);
        }
      })
    }
    else if (msg.request == 'message') {
      speak(msg.uuid, msg.text, function(error) {
        if(error) {
          respondError(ws, req, "error sending message \"" + msg.txt + "\"", error);
        }
      });
    }
    else {
      respondError(ws, req, 'unsupported request ' + receivedMessage.request + '\'');
    }

  })
});

function respondError(ws, req, human_readable_error, error) {
  let response = 'error';
  responseMessage = {response, human_readable_error, error};
  respond(ws, req, responseMessage);
}

function respond(ws, req, msg) {
  var msgString = JSON.stringify(msg);
  ws.send(msgString);
  wsLog('WS <- tx ', req, msgString);
};

const lenLog = 200;

function wsLog(prefix, req, msg) {
  console.log(prefix + req.connection.remoteAddress + ':' + req.connection.remotePort + ' ' +
    (msg.length > lenLog ? msg.slice(0, lenLog) + '...' : msg)
  );
}
