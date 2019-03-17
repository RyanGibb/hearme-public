
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


//----------------------------------------------------------------------------
//                              WebSocket Server
//----------------------------------------------------------------------------

const {createServerFrom} = require('wss');

createServerFrom(httpServer, function connectionListener (ws) {
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

//----------------------------------------------------------------------------
//                             Nexmo
//----------------------------------------------------------------------------

const domain = 'https://sound-machine-234713.appspot.com/';

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
      //answer_url: [domain + ANSWER_PATH],
      ncco: [
        // {
        //   'action': 'talk',
        //   'text': message
        // },
        // {
        //   'action': 'conversation',
        //   'name': to_number,
        //   'record': 'true'
        // }
        {
          "action" : "record",
          "format" : "wav",
          "eventUrl": [domain + EVENT_PATH_RECORDING]
        },
        {
          "action" : "talk",
          "text" : message
        },
        {
           "action": "connect",
           "endpoint": [
               {
                  //"uri": "ws://sound-machine-234713.appspot.com/nexmosocket",
                  "uri": "ws://sound-machine-234713.appspot.com:" + (port + 1),
                  "type": "websocket",
                  "content-type": "audio/l16;rate=8000"//,
                  //"headers": {}
               }
           ]
         }
      ],
      event_url: [domain + EVENT_PATH]
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

//----------------------------------------------------------------------------
//                             Google Speech to Text
//----------------------------------------------------------------------------

// async function speechToText() {
//
//   // The name of the audio file to transcribe
//   const fileName = 'audio.raw';
//
//   // Reads a local audio file and converts it to base64
//   const file = fs.readFileSync(fileName);
//   const audioBytes = file.toString('base64');
//
//   // The audio file's encoding, sample rate in hertz, and BCP-47 language code
//   const audio = {
//     content: audioBytes,
//   };
//   const config = {
//     encoding: 'LINEAR16',
//     sampleRateHertz: 16000,
//     languageCode: 'en-UK',
//   };
//   const request = {
//     audio: audio,
//     config: config,
//   };
//
//   // Detects speech in the audio file
//   const [response] = await client.recognize(request);
//   const transcription = response.results
//     .map(result => result.alternatives[0].transcript)
//     .join('\n');
//   console.log(`Transcription: ${transcription}`);
// }

var WebSocketServer = require('websocket').server;
var url = require("url");
const fs = require('fs');
const Speech = require('@google-cloud/speech');
const speech = new Speech.SpeechClient();

//Create a server
var httpServerNexmo = http.createServer(
  function (req, res) {
    // do nothing
    // res.writeHead(200, {'Content-Type': 'text/plain'});
    // res.write('Hello World!');
    // res.end();
  }
);

httpServerNexmo.listen(port + 1, function () {
  console.log('httpServerNexmo on port: ' + (port + 1));
});

var nexmows = new WebSocketServer({
    httpServer: httpServerNexmo,
    autoAcceptConnections: true,
});

// Receive Recording
app.post(EVENT_PATH_RECORDING, function(req, res) {
    var parsedUrl = url.parse(req.url, true); // true to get query as object
    var getparams = parsedUrl.query;
    var params = JSON.parse(req.body);
    console.log(req.body)
    var localfile = "files/"+params['conversation_uuid']+".wav"
    nexmo.files.save(params['recording_url'], localfile, (err, response) => {
      if(response) {
          console.log('The audio is downloaded successfully!');
          var response = {text: "http://https://sound-machine-234713.appspot.com/" + localfile,
                          languageCode: getparams.langCode,
                          user: getparams.from
                          }
      }
    });
    res.writeHead(204);
    res.end();
});

// Nexmo Websocket Handler
nexmows.on('connect', function(connection) {
    console.log((new Date()) + ' Connection accepted' + ' - Protocol Version ' + connection.webSocketVersion);
    // Create the stream at the start of the call
    var recognizeStream = new RecognizeStream(connection);
});

class RecognizeStream {
    constructor(connection) {
        this.streamCreatedAt = null;
        this.stream = null;
        this.user = null
        this.request = {
          config: {
            encoding: 'LINEAR16',
            sampleRateHertz: 8000,
            languageCode: 'en-UK' //Default Lang, will be updated with value from websocket
          },
          interimResults: false // If you want interim results, set this to true
        };
        connection.on('message', this.processMessage.bind(this));
        connection.on('close', this.close.bind(this));
    }

    processMessage(message){
        if (message.type === 'utf8') {
            // Log the initial Message
            var data = JSON.parse(message.utf8Data)
            this.request.config.languageCode = data.languageCode
            this.user = data.user
        }
        else if (message.type === 'binary') {
          this.getStream().write(message.binaryData);
        }
    }

    close(){
        this.stream.destroy();
    }

    newStreamRequired() {
        // No stream exists
        if(!this.stream) {
            return true;
        }
        // check time since stream was created.  If 60+ seconds ago create a new stream
        else {
            const now = new Date();
            const timeSinceStreamCreated = (now - this.streamCreatedAt); // returns millis since stream created
            return (timeSinceStreamCreated/1000) > 60;
        }
    }

    // helper function to ensure we always get a stream object with enough time remaining to work with
    getStream() {
        if(this.newStreamRequired()) {
            if (this.stream){
                this.stream.destroy();
            }
            this.streamCreatedAt = new Date();
            //console.log("Sending request as " + this.request.config.languageCode);
            this.stream = speech.streamingRecognize(this.request)
            .on('error', console.error)
            .on('data', this.sendTranscription.bind(this));
        }
        return this.stream;
    }

    sendTranscription(data){
        var response = {text: data.results[0].alternatives[0].transcript,
                        languageCode: this.request.config.languageCode,
                        user: this.user
                        }
        console.log(response);
        //send to client haha lmao
    }
}

//----------------------------------------------------------------------------
//                            Test
//----------------------------------------------------------------------------

// call(ryan, "the quick brown fox jumped over the lazy dog", function(error, uuid) {
//   if(error) {
//     console.log("TEST ERROR CALL " + JSON.stringify(error));
//   }
//   // else {
//   //   setTimeout(function() {
//   //     speak(uuid, "white apple",
//   //       function(error, res) {
//   //         if(error) {
//   //           console.log("TEST ERROR SPEAK " + JSON.stringify(error));
//   //         }
//   //         else {
//   //           console.log("TEST SPEAK RESPONSE " + JSON.stringify(res));
//   //         }
//   //       }
//   //     )
//   //   }, 8000);
//   // }
// });
