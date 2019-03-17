
//----------------------------------------------------------------------------
//                              HTTP Server
//----------------------------------------------------------------------------

const express = require('express');
const http = require('http');

let port = 8080;
const app = express();
const httpServer = http.createServer(app);

httpServer.listen(port, function () {
  console.log('httpServer on port: ' + port);
});

// Serve static files, such as css and scripts, from the directory below.
app.use(express.static(__dirname + '/frontend/my-app/dist/my-app/'));

app.use(express.json());

//----------------------------------------------------------------------------
//                              WebSocket Server
//----------------------------------------------------------------------------

const ws = require('ws');

const wsServer = new ws.Server({server: httpServer});

var users = {};

wsServer.on('connection', function(ws, req) {

  //respond(ws, req, {'response':'call', 'message':'test'});

  ws.on('close', function(code, req) {
    console.log('WS disconnection ' + ws._socket.remoteAddress + ':'
        + ws._socket + ' Code ' + code);
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
      call(msg.number, msg.message, function(error, conv_uuid) {
        if (error) {
          respondError(ws, req, "error calling number", error);
        } else {
          users[conv_uuid] = ws;
        }
      })
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

//----------------------------------------------------------------------------
//                             Nexmo
//----------------------------------------------------------------------------

const domain = 'http://17ee8339.ngrok.io';

const Nexmo = require('nexmo');

const seamus = '447955753134';
const ryan = '447751580894';
const george = '447543507436';

const FROM_NUMBER = '447418343240';
const EVENT_PATH = '/nexmo_event';
const EVENT_PATH_RECORDING = '/recordings';
const DEFAULT_VOICE = 'Kimberly';

const START_TEXT = 'This is an system for the hearing impaired to be able to '
                    + 'communicate over the phone through a web interface. '
                    + 'Visit ' + domain;

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
      ncco: [
        {
          "action" : "talk",
          "text" : "You have recieved a message from a hearing impaired person. "+message+" Please leave a reply after the beep and end your message with the hash key."
        },
        {
          "action" : "input",
          "timeOut" : 10,
          "action" : "record",
          "endOnKey" : '#',
          "beepStart" : 'true',
          "format" : "wav",
          "eventUrl": [domain + EVENT_PATH_RECORDING]
        },
        {
          "action" : "talk",
          "text" : "Thank you for your reply."
        }
      ]
    },
    function (err, res) {
      if(err) {
        console.error(err);
        callback(err)
      }
      else {
        console.log(res);
        callback(null, res.conversation_uuid);
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

//----------------------------------------------------------------------------
//                             Google Speech to Text
//----------------------------------------------------------------------------

var url = require("url");
const fs = require('fs');
const Speech = require('@google-cloud/speech');
const speech = new Speech.SpeechClient();

// Receive Recording
app.post(EVENT_PATH_RECORDING, function(req, res) {
    var parsedUrl = url.parse(req.url, true); // true to get query as object
    var getparams = parsedUrl.query;
    console.log(req.body);
    var params = req.body;
    var localfile = "files/"+params['conversation_uuid']+".wav"
    nexmo.files.save(params['recording_url'], localfile, (err, response) => {
      if (err) {
          console.log('Audio saving error: ' + err);
      }
      else {
          console.log('The audio is downloaded successfully!');
          var response = {text: "http://https://sound-machine-234713.appspot.com/" + localfile,
                          languageCode: getparams.langCode,
                          user: getparams.from
                          }
          console.log(params.conversation_uuid);
          speechToText(params.conversation_uuid);

      }
    });
    res.writeHead(204);
    res.end();
});

async function speechToText(con_uuid) {
  const fileName = "files/"+con_uuid+".wav";

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
  const [responseSPEECH] = await speech.recognize(request);
  const transcription = responseSPEECH.results
    .map(result => result.alternatives[0].transcript)
    .join('\n');
  console.log(`Transcription: ${transcription}`);


  let ws = users[con_uuid];
  //let response = "call";
  //let message = transcription;
  //console.log(JSON.stringify(connection));
  // console.log("WS:" + JSON.stringify(ws));
  // console.log("REQ: " + JSON.stringify(req));

    var msgString = {'request':'call', 'message':transcription};
    var sendVar = JSON.stringify(msgString);
    console.log(sendVar)
      ws.send(sendVar);
    console.log("WS AUDIO <- " + ' ' +
      (msgString.length > lenLog ? msgString.slice(0, lenLog) + '...' : msgString)
    );

  //respond(user[0], user[1], {'response':'call', 'message':transcription});

  //  respondError(connection[0], connection[1], "Error parsing audio", error);
  //return transcript;
}

//----------------------------------------------------------------------------
//                            Test
//----------------------------------------------------------------------------

// call(ryan, "the quick brown fox jumped over the lazy dog", function(error, uuid) {
//   if(error) {
//     console.log("TEST ERROR CALL " + JSON.stringify(error));
//   }
// //   // else {
// //   //   setTimeout(function() {
// //   //     speak(uuid, "white apple",
// //   //       function(error, res) {
// //   //         if(error) {
// //   //           console.log("TEST ERROR SPEAK " + JSON.stringify(error));
// //   //         }
// //   //         else {
// //   //           console.log("TEST SPEAK RESPONSE " + JSON.stringify(res));
// //   //         }
// //   //       }
// //   //     )
// //   //   }, 8000);
// //   // }
// });
