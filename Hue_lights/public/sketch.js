let hueSlider, briSlider, ctSlider;

const socketUrl = '10.138.68.161';  
const socketPort = ':8080';

//Socket
var socket;

//Kvadranter
let kvadrant1, kvadrant2, kvadrant3, kvadrant4;
let kvadrantPlads;

//Mic
let mic, volume;

//Buffer
let miMicArray = [];
let highestVol = 0;
let VolCounter = 0;
const VolCounterLimit = 60 * 3;

const password = "h";
let admin = false;
let ableToSend = false;
let toAudio

function setup(){

    socket = io.connect("http://" + socketUrl + socketPort);

// ---------- Kvadranter ---------- //
    kvadrant1 = createButton("Kvadrant 1", 1).size(100, 100).position(0, 0).mousePressed(prom).id("kvad1");
    kvadrant2 = createButton("Kvadrant 2", 2).size(100, 100).position(100, 0).mousePressed(prom).id("kvad2");
    kvadrant3 = createButton("Kvadrant 3", 3).size(100, 100).position(0, 100).mousePressed(prom).id("kvad3");
    kvadrant4 = createButton("Kvadrant 4", 4).size(100, 100).position(100, 100).mousePressed(prom).id("kvad4");

// ---------- Slut ---------- //

    let cnv = createCanvas(500, 500).position(0,200);
    for(i = 0; i <= 9; i++){
        createElement("br");
    }

    /*
    createElement("h1", lightNumber);*/

    passwordChecker = createInput("", "text").position(400, 200).input(checkPassword).attribute('placeholder', 'Admin password');

    //conBut = createButton("connect").mousePressed(connect);

    // hueBut = createButton("hue").mousePressed(setHue);
    // hueSlider = createSlider(0, 65534, 0, 1);
    // createDiv("hue value: " + hueSlider.value());
    // createElement("br");
/*
    briBut = createButton("brightness").mousePressed(setBri);
    briSlider = createSlider(1, 254, 1, 1);
    createDiv("brightness value: " + briSlider.value());
    createElement("br");

    ctBut = createButton("color temperature").mousePressed(setct);
    ctSlider = createSlider(153, 500, 300, 1);
    createDiv("ct value: " + ctSlider.value());
    createElement("br");

    resultDiv = createDiv("result");*/

    // Sockets.on's
    socket.on("kvadrantResponse", function(data){
        if(data = kvadrantPlads){
            console.log("reponse");
            ableToSend = true;
            document.getElementById("kvad" + String(data)).style.backgroundColor = "red";
            
            //mic = new p5.AudioIn();
            //mic.start();
        }else{
            alert("Error, reload site");
        }
    })

    /*
    document.querySelector('button').addEventListener('click', function() {

        toAudio = new AudioContext();
      
      });*/
      

}

function draw(){
    
    
    // Sæt lydniveau
    if(ableToSend){
        //volume = mic.getLevel();
        volume = random();
        console.log(volume);
    }
    //Logger det højeste lydniveau
    VolCounter++;
    //console.log("Counter: " + VolCounter);
    if(volume > highestVol){
        highestVol = volume;
        console.log("Højeste Volume: " + highestVol);
                // Send socket besked
                socket.emit("sound", highestVol);
    }
    // Tæller ned til at sende det højrste lyd niveau
    if(VolCounter >= VolCounterLimit){
        // Sender, hvis den har fået sat en plads
        if(ableToSend){
            socket.emit('control', {
                kvadrant: kvadrantPlads,
                lyd: highestVol,
            });
        }

        VolCounter = 0;
        highestVol = 0;

    }
    //Check om admin
    if(admin === true){
        //background(0);
        fill(255,177, 110);
        stroke(0);
        ellipse(400, 100, 20, 20);
    }


    /*
    if(mouseIsPressed && frameCount%90){
        setHue(hueSlider.value);
    }
*/
}

/*
function connect() {
    url = "http://" + bridgeIP + '/api/' + username + '/lights/';
    httpDo(url, 'GET', dispRes);
    //console.log("hej");
}
*/

/*
this function uses the response from the hub
to create a new div for the UI elements
*/

function prom(){
    if (getAudioContext().state !== 'running') {
        getAudioContext().resume();
      }

    if(confirm("Er det den rigtige kvadrant " + this.elt.value + " ?")){
        kvadrantPlads = this.elt.value;
        socket.emit("kvadrant", kvadrantPlads);
        console.log(kvadrantPlads);
    }

}

function checkPassword(){
    if(this.value() == password){
        admin = true;
    }
}