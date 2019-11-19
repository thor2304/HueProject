const username = "5xw1qxEArnQZ5Xc3fiNQNjsudXhi7BiZaGGk-JzC";
const bridgeIP = "192.168.0.102";
let url = "";
let resultDiv;
let conBut;
let hueBut;
let briBut;
let ctBut;

let hueSlider;
let briSlider;
let ctSlider;

const lightNumber = 16;

function setup(){
    createCanvas(0,0);
    createElement("h1", lightNumber);

    //conBut = createButton("connect").mousePressed(connect);

    hueBut = createButton("hue").mousePressed(setHue);
    hueSlider = createSlider(0, 65534, 0, 1);
    createDiv("hue value: " + hueSlider.value());
    createElement("br");

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