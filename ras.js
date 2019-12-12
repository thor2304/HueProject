//request bruges til at styre hue lamperne
const request = require("request");
//nedenstående bruges til at få adgang til mikrofonen
var mic = require('mic');
var fs = require('fs');
const WavDecoder = require("wav-decoder");
var header = require("waveheader");

 

// Variables for our buffering of noise
const VolCounterLimit = 30; //seconds of audio
const bufferMinutes = 5;
const bufferSize = (60 * 60 * bufferMinutes) / (60 * VolCounterLimit);

let connNumber = 0;
let globalMicArray = [];
let averageNoises = [];

let d = new Date();
let n = d.getSeconds();
t

//setup of the raspberry pi mic capture
const config = {
    rate: 44100,
    channels: 2,
    device: `plughw:${process.argv[2] || 0}`,
    fileType: 'wav',
  };


// variables used by the clap detection
const minTime = 500; // ms
const threshold = 0.7;
let time = null;
let buffers = [];
const micInstance =  mic(config);
const stream = micInstance.getAudioStream();

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
          if (maxAmplitude > threshold) {
           console.log('-----> clap'); // -> this is the place where we put our own larger buffer
          }
        })
        .catch(console.log);
      time = newTime; // -> reset the timer
      buffers = []; // free recorded data
    }
  });
  
  time = new Date().getTime();
  micInstance.start();