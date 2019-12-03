const username = "5xw1qxEArnQZ5Xc3fiNQNjsudXhi7BiZaGGk-JzC";
const bridgeIP = "192.168.0.102";
let url = "";
let resultDiv;
let conBut, hueBut, briBut, ctBut;
let hueSlider, briSlider, ctSlider;

//Socket
var socket;

//Kvadranter
let kvadrant1, kvadrant2, kvadrant3, kvadrant4;
let kvadrantPlads;

//Mic
let mic, volume;

//Buffer
let micBuf = [];
let highestVol = 0;
let VolCounter = 0;
let VolCounterLimit = 60 * 30;
let bufferMinutes = 5;
let bufferSize = (60 * 60 * bufferMinutes) / VolCounterLimit;

const lightNumber = 24;

let password = "hej";
let admin = false;


function setup(){
    createCanvas(200, 200);
    createElement("h1", lightNumber);

    socket = io.connect("http://10.138.66.109:3000");

// ---------- Kvadranter ---------- //
    kvadrant1 = createButton("Kvadrant 1", 1).size(100, 100).position(0, 0).mousePressed(prom);
    kvadrant2 = createButton("Kvadrant 2", 2).size(100, 100).position(100, 0).mousePressed(prom);
    kvadrant3 = createButton("Kvadrant 3", 3).size(100, 100).position(0, 100).mousePressed(prom);
    kvadrant4 = createButton("Kvadrant 4", 4).size(100, 100).position(100, 100).mousePressed(prom);

// ---------- Slut ---------- //

    passwordChecker = createInput("", "password").position(400, 200).input(checkPassword).attribute('placeholder', 'Admin password');

// ---------- Mic ---------- //
    mic = new p5.AudioIn();
    mic.start()

// ---------- Slut ---------- //


    //conBut = createButton("connect").mousePressed(connect);

    // hueBut = createButton("hue").mousePressed(setHue);
    // hueSlider = createSlider(0, 65534, 0, 1);
    // createDiv("hue value: " + hueSlider.value());
    // createElement("br");

    briBut = createButton("brightness").mousePressed(setBri);
    briSlider = createSlider(1, 254, 1, 1);
    createDiv("brightness value: " +briSlider.value());
    createElement("br");

    ctBut = createButton("color temperature").mousePressed(setct);
    ctSlider = createSlider(153, 500, 300, 1);
    createDiv("ct value: " +ctSlider.value());
    createElement("br");

    resultDiv = createDiv("result");

    url = "http://" + bridgeIP + '/api/' + username + '/lights/';
    httpDo(url + lightNumber, 'GET', dispRes);
}

function draw(){
    // Sæt lydniveau
    volume = mic.getLevel();

    //Logger det højeste lydniveau
    VolCounter++;
    //console.log("Counter: " + VolCounter);
    if(volume > highestVol){
        highestVol = volume;
        console.log("Højeste Volume: " + highestVol);
                // Send socket besked
                socket.emit("sound", highestVol);
    }
    if(VolCounter >= VolCounterLimit){
        // Laver en buffer på lydniveauet
        if(micBuf.length < bufferSize){
            micBuf.push(highestVol);
        }else{
            micBuf.splice(1, 1);
            micBuf.push(highestVol);
        }
        console.log("Buffer længde: " + micBuf.length)
        console.log(micBuf);
        VolCounter = 0;
        highestVol = 0;

        
    }
    //Check om admin
    if(admin === true){
        background(0);
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
function dispRes(result) {
    //console.log(result);
    resultDiv.html("<br><hr/>" + result);
}

function setLight(whichLight, data){
    let path = url + whichLight + "/state/";

    const content = JSON.stringify(data);
    httpDo(path, 'PUT', content, 'text', dispRes);

}

function setHue(){
    
    const hue = {
        hue: hueSlider.value(), 
        on: true,
        transitiontime: 1,
    }

    setLight(lightNumber, hue);
}

function setBri(){
    
    const bri = {
        bri: briSlider.value(), 
        on: true,
        transitiontime: 0,
    }

    setLight(lightNumber, bri);
}

function setct(){
    
    const ct = {
        ct: ctSlider.value(), 
        on: true,
        transitiontime: 1,
    }

    setLight(lightNumber, ct);
}

function prom(){
    if(confirm("Er det den rigtige kvadrant " + this.elt.value + " ?")){
        kvadrantPlads = this.elt.value;
        console.log(kvadrantPlads);
    }
}

function checkPassword(){
    if(this.value() == password){
        admin = true;
    }
}