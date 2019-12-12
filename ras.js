//request bruges til at styre hue lamperne
const request = require("request");
//nedenstående bruges til at få adgang til mikrofonen
var mic = require('mic');
var fs = require('fs');
const WavDecoder = require("wav-decoder");
var header = require("waveheader");
var _ = require('lodash');


// Setting up hue //
const username = "5xw1qxEArnQZ5Xc3fiNQNjsudXhi7BiZaGGk-JzC"; //gustavs nye til os er: 4PpVIdltqS91AG5YnyjWBu7E8Cp27ltZAVaI5Kj
const bridgeIP = "192.168.0.102";
const whichLight = 24;
const urlLights = "http://" + bridgeIP + '/api/' + username + '/lights/';


//urlLights = "http://" + bridgeIP + '/api/' + username + '/lights/';

function setLight(data){
    let path = urlLights + whichLight + "/state/";

    //const content = JSON.stringify(data);
    request({
        method: "PUT",
        uri: path,
        json: data,
    }, console.log("requestSucces"));
    //httpDo(path, 'PUT', content, 'text', dispRes);  // Lav til request

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
const minTime = 500; // ms
const threshold = 0.5;
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

            if(flip){
                setBri(150, true);
                console.log("on");
            }else{
                setBri(150, false);
                console.log("off");
            }

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