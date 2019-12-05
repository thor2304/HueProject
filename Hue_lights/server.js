//Serveren brger en pakke der hedder express. Express gør det hurtigt og nemt at lave en webserver på en bestemt port.
var express = require('express');
const request = require("request");
//app er en instans af express objektet.  
var app = express();
//Nu opretter vi så en server og siger hvilken port den skal lytte på. 
var server = app.listen(8080);
//Serveren får besked om at vise (statiske) filer i mappen public hvis der kommer en interesseret klient 
app.use(express.static('public'));
//Importer pakken socket ind i variablen socket 
var socket = require('socket.io');
// Lav en instans af socket objektet, som bruger den server vi lavede tidligere 
var io = socket(server);
//Fortæl konsollen at serveren kører
console.log("Socket server kører på port 3000");


// Når eventet connection sker, kald funktionen nySocket
io.sockets.on('connection', nySocket);

// Variable
const VolCounterLimit = 30; //seconds of audio
const bufferMinutes = 5;
const bufferSize = (60 * 60 * bufferMinutes) / (60 * VolCounterLimit);

let connNumber = 0;
let globalMicArray = [];
let averageNoises = [];

let d = new Date();
let n = d.getSeconds();

let kvadrantLamper = [0, 24, 0, 0, 0];

let firstConn = true;




function nySocket(socket) {
// Lav sockets.on her!
    console.log("Ny socket");

    const myConnNumber = connNumber;
    connNumber++;

    let myMicArray = [];

    socket.on('kvadrant', function(data) {
        //console.log("kvadrant Connection");
        socket.emit('kvadrantResponse', data);
        
    })

    socket.on('control', function(data){
        if(firstConn){
            arrayRead(); 
            setInterval(arrayRead, 1000);
            firstConn = false;
        }

        kvadrant = data.kvadrant;
        lyd = data.lyd;

        myMicArray[0] = kvadrant;

        if(myMicArray.length < bufferSize){
            myMicArray.push(lyd);
        }else{
            myMicArray.splice(1, 1); 
            myMicArray.push(lyd);
        }

        globalMicArray[myConnNumber] = myMicArray;

        //console.log("Buffer længde: " + micBuf.length)
        //console.log(micBuf1);        
    })
}

function displayMsg(data){
    console.log(data);
}

// SKal bare "gøre noget med arrayet"
function arrayRead(){
    for(i = 0; i < globalMicArray.length -1; i++){
        let kvadrantN = globalMicArray[i][0];
        
        let tNoise = 0;
        let nNoise = 0;

        if(averageNoises[kvadrantN]){
            tNoise = averageNoises[kvadrantN].tnoise;
            nNoise = averageNoises[kvadrantN].nnoise;
        }    

        for(j=1; j< globalMicArray[i].length -1; j++){
            tNoise += globalMicArray[i][j];
            nNoise ++;

            if(nNoise == globalMicArray[i].length- 1){
                averageNoises[kvadrantN] = {
                    tnoise: tNoise,
                    nnoise: nNoise,
                };

                console.log("averageNoise nnoise for " + kvadrantN + " er " + averageNoises[kvadrantN].nnoise +" og tnoise "+ averageNoises[kvadrantN].tnoise );
 
                if(i==globalMicArray.length){
                    for(k=1; k<averageNoises.length; k++){
                        averageNoises[k] = averageNoises[k].tnoise / averageNoises[k].nnoise;
                        console.log("det endelige gennesnit blev i kvadrant " + k + ": " + averageNoises[k]);
                    }
                }
            }
        }

        
    }

    //setlights

}

// Hue //
const username = "5xw1qxEArnQZ5Xc3fiNQNjsudXhi7BiZaGGk-JzC";
const bridgeIP = "192.168.0.102";
let urlLights = "";

urlLights = "http://" + bridgeIP + '/api/' + username + '/lights/';


function setLight(whichLight, data){
    let path = urlLights + whichLight + "/state/";

    //const content = JSON.stringify(data);
    request({
        method: "PUT",
        uri: path,
        json: data,
    }, console.log("requestSucces"));
    //httpDo(path, 'PUT', content, 'text', dispRes);  // Lav til request

}

function setHue(lightNumber, value){
    
    const hue = {
        hue: value, 
        on: true,
        transitiontime: 1,
    }

    setLight(lightNumber, hue);
}

function setBri(lightNumber, value){
    
    const bri = {
        bri: value, 
        on: true,
        transitiontime: 0,
    }

    setLight(lightNumber, bri);
}

function setCt(lightNumber, value){
    
    const ct = {
        ct: value, 
        on: true,
        transitiontime: 1,
    }

    setLight(lightNumber, ct);
}
