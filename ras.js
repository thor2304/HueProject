//request bruges til at styre hue lamperne
const request = require("request");
//nedenstående bruges til at få adgang til mikrofonen
var mic = require('mic');
var fs = require('fs');
const WavDecoder = require("wav-decoder");
var header = require("waveheader");
var _ = require('lodash');
let overallBri = 100;

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

function setBri(value, tTime){
    
    const bri = {
        bri: value, 
        on: true,
        transitiontime: tTime,
    }

    setLight(bri);
}

function lampOff(){
    
  const bri = { 
      on: false,
      transitiontime: 0,
  }

  setLight(bri);
}
 

let fullOn = false;

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



// Variables for our buffering of noise
const minTime = 1000 * 3; // ms
const lowThreshold = 0.3;
const highThreshold = 0.65;

const bufferMinutes = 5;
const bufferSize = (60 * bufferMinutes) / (minTime / 1000);

let time = null;
let buffers = [];
const micInstance =  mic(config);
const stream = micInstance.getAudioStream();

let globalSum;
let globalAverage;
let globalMedian;
let globalMedianArray;
let calculatedNoise;

setBri(overallBri, true, 0);

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
          globalMedianArray = globalMicArray;
          globalMedianArray.sort();
          globalMedian = globalMedianArray[Math.round(globalMedianArray.length / 2)];

          calculatedNoise =  globalAverage / Math.abs(globalAverage - globalMedian) ;

          
          console.log(globalAverage);
          console.log("globalMicArray length: " + globalMicArray.length);
          console.log("maxAmplitude: " + maxAmplitude);
          console.log("Global median: " + globalMedian);
          

          if(globalAverage <= lowThreshold){
            console.log("average er under threshold");

            if(!fullOn){
              setBri(255, 4);
              fullOn = true;
            }

          }else if(globalAverage > lowThreshold && globalAverage <= highThreshold){
            console.log("average er over nedre threshold, og under øvre");

            let calculatedBrightness = map(calculatedNoise, 0, 10, 255, 10);
            //setBri(calculatedBrightness , 4);
            console.log("calculated Noise: " + calculatedNoise);  
            console.log("calculatedBrightness: " + calculatedBrightness);           

          }else if(globalAverage > highThreshold){
            console.log("average er over øvre threshold");
            lampOff();

          }else{
            console.log("Ingen virkede");
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
