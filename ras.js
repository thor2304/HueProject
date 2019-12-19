// Lavet af: Thor Malmby Jørgin og Frederik Greve Petersen, fra Digital Teknik, teknikfag.

// Justerbare variabler.
  const initialBri = 100; // Angives med en værdi mellem 0 og 254;

  // Variable for vores buffer, der håndtere lyd.
  const minTime = 1000 * 10; // ms.  Bruges til at lytte inden for et bestem tidsrum. Det er dette vindue vi lytter i.

  // Værdier angives mellem 0 og 1.
  const lowThreshold = 0.1;
  const highThreshold = 0.4;

  const bufferMinutes = 2; // Antal minutter
  const bufferSize = (60 * bufferMinutes) / (minTime / 1000); // -> Beregner buffer størrelsen.

const request = require("request"); // -> request bruges til at styre hue lamperne
const mic = require('mic'); // -> bruges til at få adgang til mikrofonen og laver en stram-wrapper.

// Biblioteker til konvertering af mikrofon input, til tal.
const WavDecoder = require("wav-decoder"); 
const header = require("waveheader");

const _ = require('lodash'); // Utility library, med flere forskellige smarte funktioner.

// Setting up hue ...
const username = "re-EALRTkvHkNYTtpbYTGufY8yXhDAWZGaYwrthr"; // -> Hue API username, der giver adgang til API'et det er ligesom en access-key.  Fungere kun til Hue-brigden brug på skolen i lokale 21.
// Hue brigde's IP-addresse.
const bridgeIP = "192.168.0.102";
// Nummeret på den lampe der ændres
const whichLight = 24;
// Opstiller url'en, som skal bruges til request-kaldet
const urlLights = "http://" + bridgeIP + '/api/' + username + '/lights/';

// Funktionen der ændrer lampen.
function setLight(data){
    let path = urlLights + whichLight + "/state/"; // -> Opretter en path, som requesten skal bruge, udfra URL'en
    console.log("set path");

    // Kalder request, som er en funktion i bibliotektet "request", som laver et http-kald.
    request({
        method: "PUT",  // Den metode http-requesten bruger. PUT er en funktion som ændre noget ved det json objekt der tilgås gennem API'en
        uri: path, // Det url, requesten kaldes på.
        json: data,  // Her angives formattet som JSON og giver den data, som er et JSON objekt.
    }, function (error, response, body){ // Error callback funktion
      if(error){
        console.log("error", error);
      }
      //console.log("response, ", response);
      console.log('Uploaded, body:', body);
    });
    //httpDo(path, 'PUT', content, 'text', dispRes);  // En gammel p5 funktion, som kan bruges i stedet for request. Denne kan bruges på en computer med p-bibliotekket.
    console.log("make request");
}
// Ændre lysstyrken og transistiontime.
function setBri(value, tTime){ //lysstyken værdien angives som et hel tal mellem 0 og 254, hvor transistion time (tTime), i helttal, hvor 1, er 100 ms.
    // Opstiller objektet, der sendes til Hue-API'en.
    const bri = {
        bri: value, 
        on: true,  // Siger at lampen er tændt
        transitiontime: tTime,
    }
    setLight(bri); // -> Kalder funktionen der laver http-kaldet, med det opstillede objekt
}
// Slukker lampen
function lampOff(){    
  const bri = { 
      on: false,
      transitiontime: 0,
  }
  // Kalder funktionen der laver http-kaldet, med det opstillede objekt
  setLight(bri);
}
 
let fullOn = false; // -> Angiver om lampen er helt tændt. Den sikre os at vi ikke sender udnødvendige http-requests, om at lampen skal være helt tændt, når den allerede er det.
let micArray = []; // -> Bruges til at håndtere alle mikrofon inputs værdier.

// Setup af raspberry-pi'ens mic capture
const config = {
  rate: 44100, // Refresh raten på mikrofonen brugt til lyd indsamling
  channels: 1, // Angiver hvilken kanal mikofonenen sidder.
  //device: `plughw:${process.argv[2] || 0}`,  Den var en del af det vi brugte til at starte med (Virker ikke for os). Det kan være den er relevant for forbindelsen af en mikrofon til Pi'en.
  fileType: 'wav',  // Optager til en fil, med typen:
  debug:true,   // Giver fejlmeddelser, ja tak.
  };


let time = null; // -> Håndtere tiden.
let buffers = []; // -> Buffer arrayet der håndtere alle indkommende mikrofon inputs.
const micInstance =  mic(config); // -> Opretter en forbindelse til mikrofonen med config objektet opsat længere oppe. "mic" biblioteket bruges
const stream = micInstance.getAudioStream(); // -> Opretter en "forbindelse" til lyd-strøm fra mikorfonen.

// Opretter variabler til håndtering af lyd-inputs. Navne giver sig selv. 
let sum; 
let average;

setBri(initialBri, 0); // -> Starter med at sætte brigtness til en bestemt værdi, for at man ikke for ondt i øjne mens man arbejder. Har også den funktionen at det tænder lampen, ved opstart af programmet.


// Når vi for en besked "data" fra lyd-strømmen, kør følgende:
stream.on('data', buffer => {
    
  // Følgende del er baseret udfra et online projekt, som bruges til at opfange et klap.
    // Link: https://apiko.com/blog/how-to-create-home-automation-app-for-clap-detection-with-node-js-and-raspberry-pi/?fbclid=IwAR3ecEdqA1Y_P4AA_u_1ONEK7cdcAmdQeY4vYiuBF3BkZC8cEoS-BqqpMGw
    const newTime = new Date().getTime(); // -> Henter tiden idet funktionen kaldes
    buffers.push(buffer); // -> Gemmer tidligere data i buffer arrayet
    if(newTime - time > minTime) { // -> Gør noget, hvis minimun tiden passeres
      const headerBuf = header(config.rate, config); // -> Laver en wav header
      buffers.unshift(headerBuf); // -> Indsætter wav-headeren på plads 0 i buffer arrayet.
      const length = _.sum(buffers.map(b => b.length)); // Henter summen af arrayet
      
      WavDecoder.decode(Buffer.concat(buffers, length)) // -> Decoder bufferen til et float array
        .then(audioData => {
          const wave = audioData.channelData[0]; // -> Henter et array fra kanal 1.
          const maxAmplitude = _.max(wave); // -> Gemmer den højeste lyd-værdi
          
          micArray.push(maxAmplitude); // -> Her gemmer vi den højeste lyd i arrayet,

          if(micArray.length >= bufferSize){ // -> Hvis arrayet er for langt, splicer værdien på plads 0.
            micArray.splice(0, 1);
          }

          sum = _.sum(micArray); // -> Tager summen af array'et med de højeste lyde.
          average = sum / micArray.length; // -> Beregner gennemsnittet af de højeste lyde.

         //Dette blev brugt til at udregne støjen, men er meget ufordusigeligt. Særligt når arrayet er meget småt
          /* 
          MedianArray = micArray;
          MedianArray.sort();
          Median = MedianArray[Math.round(MedianArray.length / 2)];

          calculatedNoise =  average / Math.abs(average - Median); 
          */

          // Console logs, så man kan se de forskellige værdieri kommandopromten
          console.log("average: " + average);
          console.log("micArray length: " + micArray.length);
          console.log("maxAmplitude: " + maxAmplitude);
          //console.log(" median: " + Median);
          
          // Hvis gennemsnitet af de høje lyde er mindre end hvad der er relevant, så er pæren helt tændt, med den største brightness.
          if(average <= lowThreshold){
            console.log("average er under threshold");

            if(!fullOn){
              setBri(254, 4);
              fullOn = true;
            }
          // Hvis gennemsnitet af høje lyde ligger mellem treshholds'ne, ændre lyssyrken sig henholdsvis efter hvor meget larm der et. Jo mere larm, jo mindre lyst er lampen
          }else if(average > lowThreshold && average <= highThreshold){
            console.log("average er over nedre threshold, og under øvre");

            let calculatedBrightness = Math.round(map(average, lowThreshold, highThreshold, 255, 10)); // -> Beregner en værdi, der bruges til at angive hvor meget lyset skal dæmpes.

            // Holder den varialble på en værdi over 10
            if(calculatedBrightness < 10){
              calculatedBrightness = 10;
            }
            
            setBri(calculatedBrightness , 2); // -> Sætter lampen til den beregnet værdi.
            console.log("calculatedBrightness: " + calculatedBrightness); 
            fullOn = false;          
            
          // Hvis treshholden overskrides, slukker lampen.
          }else if(average > highThreshold){
            console.log("average er over øvre threshold");
            lampOff(); // -> Kalder en funktion der slukker lampen
            fullOn = false;

          }else{
            console.log("Ingen virkede");
          }
        })
        .catch(console.log);
      time = newTime; // -> Reset tiden, hvilket fungerer som timer.
      buffers = []; // -> Tøm arrayet, der bruges til alle mic-inputs.
    }
  });
  
  // Hvis der slet ikke er nogen lyd, laver en console log.
  stream.on('silence', function() {
    console.log("Got SIGNAL silence");
});
  // Hvis der er en fejl, send en error console log.
  stream.on('error', function(err) {
    cosole.log("Error in Input Stream: " + err);
});

// Vores egen kreeret map-funktion (Lavet uden guides), da P5 ikke virkede, som en pakke på Pi'en.
function map(inp, a,b, c,d){
    output = c- ( (inp - a) / (b-a) ) * (c-d);

    return output;
}

time = new Date().getTime(); // -> Sætter tiden til den nuværende tid.
micInstance.start(); // -> Starter programmet, så nu vil programmet begynde at lytte. Denne del er ekstrem vigtig. Uden denne linje, vil der ikke ske noget. 
