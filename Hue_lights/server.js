//Serveren brger en pakke der hedder express. Express gør det hurtigt og nemt at lave en webserver på en bestemt port.
var express = require('express');
//app er en instans af express objektet.  
var app = express();
//Nu opretter vi så en server og siger hvilken port den skal lytte på. 
var server = app.listen(3000);
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
let micBuf = [];
let VolCounterLimit = 60 * 30;
let bufferMinutes = 5;
let bufferSize = (60 * 60 * bufferMinutes) / VolCounterLimit;


function nySocket(socket) {
// Lav sockets.on her!


    socket.on('kvadrant', function(data) {
        console.log("Connection");
        socket.emit('kvadrantResponse', data);
    })
   

    socket.on('control', function(data){
        kvadrant = data.kvadrant;
        lyd = data.lyd;

        // Laver en buffer på lydniveauet
        if(micBuf.length < bufferSize){
            micBuf.push(lyd);
        }else{
            micBuf.splice(1, 1); 
            micBuf.push(lyd);
        }
        console.log("Buffer længde: " + micBuf.length)
        console.log(micBuf);        
    })

}

function displayMsg(data){
    console.log(data);
}
