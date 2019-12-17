//request bruges til at styre hue lamperne
const request = require("request");
//nedenstående bruges til at få adgang til mikrofonen
var mic = require('mic');
var fs = require('fs');
const WavDecoder = require("wav-decoder");
var header = require("waveheader");
var _ = require('lodash');
let overallBri = 120;

// Setting up hue //
const username = "re-EALRTkvHkNYTtpbYTGufY8yXhDAWZGaYwrthr"; 
const bridgeIP = "192.168.0.102";
const whichLight = 24;
const urlLights = "http://" + bridgeIP + '/api/' + username + '/lights/';


//urlLights = "http://" + bridgeIP + '/api/' + username + '/lights/';

function setLight(data){
    let path = urlLights + whichLight + "/state/";
    console.log("set path");

    //const content = JSON.stringify(data);
    request({
        method: "PUT",
        uri: path,
        json: data,
    }, function (error, response, body){
      if(error){
        console.log("error", error);
      }
      //console.log("response, ", response);
      console.log('Uploaded, body:', body);
    });
    //httpDo(path, 'PUT', content, 'text', dispRes);  // Lav til request
    console.log("make request");
}

function setBri(value, on){
    
    const bri = {
        bri: value, 
        on: on,
        transitiontime: 0,
    }

    setLight(bri);
}
 

// Variables for our buffering of noise
const VolCounterLimit = 30; //seconds of audio
const bufferMinutes = 5;
const bufferSize = (60 * 60 * bufferMinutes) / (60 * VolCounterLimit);

let flip = false;

let connNumber = 0;
let globalMicArray = [];
let averageNoises = [];

let d = new Date();
let n = d.getSeconds();


//setup of the raspberry pi mic capture
const config = {
    rate: 44100,
    channels: 1,
    //device: `plughw:${process.argv[2] || 0}`,
    fileType: 'wav',
    debug:true,
    //exitOnSilence:6,
  };



// variables used by the clap detection
const minTime = 1000 * 30; // ms
const threshold = 0.6;
let time = null;
let buffers = [];
const micInstance =  mic(config);
const stream = micInstance.getAudioStream();

let globalSum;
let globalAverage;

setBri(overallBri, true);

stream.on('data', buffer => {
    
    const newTime = new Date().getTime(); // -> get new time
    buffers.push(buffer); // -> save previous recorded data
    if(newTime - time > minTime) { // -> start do something if min time pass
      const headerBuf = header(config.rate, config); // ->  create wav header
      buffers.unshift(headerBuf); // -> set header in top of buffers
      const length = _.sum(buffers.map(b => b.length));
      
      WavDecoder.decode(Buffer.concat(buffers, length)) // -> decode buffers to float array
        .then(audioData => {
          const wave = audioData.channelData[0];
          const maxAmplitude = _.max(wave);
          
          //this is where we make the buffer array
          globalMicArray.push(maxAmplitude);

           if(globalMicArray.length >= bufferSize){
            globalMicArray.splice(0, 1);
            }

            globalSum = _.sum(globalMicArray);
            globalAverage = globalSum / globalMicArray.length;
            console.log(globalAverage);

            switch(globalAverage){
              case globalAverage <= threshold:

                console.log("average er under threshold");
                break;

              case globalAverage > threshold:
                console.log("average er over threshold");
                break;

              default:
                console.log("default case");

            }
            
          

        })
        .catch(console.log);
      time = newTime; // -> reset the timer
      buffers = []; // free recorded data
    }
  });
  
  stream.on('silence', function() {
    console.log("Got SIGNAL silence");
});
 
stream.on('error', function(err) {
    cosole.log("Error in Input Stream: " + err);
});


time = new Date().getTime();
micInstance.start();
