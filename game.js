//#region Header
/* 
    Autor: Niklas Mickelat inspiriert bei Dr. Radu Mariescu-Istodo
    Date: 05/04/2023

    Description:

        NEAT : Neural Evolution of Augmenting Topologies
        https://nn.cs.utexas.edu/downloads/papers/stanley.ec02.pdf 

        Mit diesem 2D-Canvas Projekt wird der NEAT Algorithmus veranschaulicht.
        Er wurde von Kenneth O. Stanley und Risto Miikkulainen entwickelt und erstmals im Jahr 2002 im wissenschaftlichen Artikel "Evolving Neural Networks through Augmenting Topologies" vorgestellt.

        Der NEAT-Algorithmus verwendet sowohl die Struktur als auch die Gewichtungen der Verbindungen zwischen Neuronen, 
        um optimale neuronale Netze für ein bestimmtes Problem zu entwickeln. Im Gegensatz zu anderen Neuroevolutionsansätzen, 
        die entweder die Struktur oder die Gewichte der Netzwerke verändern, kombiniert NEAT beide Ansätze. 
        Eine Besonderheit von NEAT ist die Verwendung eines "historischen Markierungssystems" (genannt Gene History), 
        um das Problem des konkurrierenden Zusammenführens von Spezies (engl. "competing conventions problem") 
        während der Kreuzung von verschiedenen Netzwerkstrukturen zu lösen.
*/
//#endregion Header



//#region Gobals

// car Canvas
const carCANVAS = document.getElementById("carCanvas");
const carCTX = carCANVAS.getContext("2d");

// nn Canvas
const nnCANVAS = document.getElementById("nnCanvas");
const nnCTX = nnCANVAS.getContext("2d");

// canvas BREITEN initial einmal setzen wenn Handy oder Desktop
if (window.innerWidth <= 1000){
    carCANVAS.width = window.innerWidth * 0.7;
    nnCANVAS.width = window.innerWidth; // in style.css hier 100vw
    
}else{
    carCANVAS.width = 400;
    nnCANVAS.width = window.innerWidth * 0.5; // muss 50% sein, weil wir 50vw in style.css genommen haben
}
// HÖHEN werde in animate() gesetzt


// BTNs
const saveBTN = document.getElementById("saveBTN");
const killBTN = document.getElementById("killBTN");
// Kamera
const spawnViewBTN = document.getElementById("spawnViewBTN");
let viewSPAWN = false;
// selber Steuern
const controllerBTN = document.getElementById("controllerBTN");
let STEUERN = false;

const restartBTN = document.getElementById("restartBTN");
const exportBTN = document.getElementById("exportBTN");
const loadBTN = document.getElementById("loadBTN");
const resetBTN = document.getElementById("resetBTN");

// CheckBoxen
const autoLoadCHECKBOX = document.getElementById("autoLoadCHECKBOX");
let autoLoad = false;
if(localStorage.getItem("autoLoad")){ // wenn bereits im Speicher vorhanden
    autoLoad = JSON.parse(localStorage.getItem("autoLoad")); //JSON.parse() weil sonst ein String 
}
autoLoadCHECKBOX.checked = autoLoad;

const autoEpochCHECKBOX = document.getElementById("autoEpochCHECKBOX");
let autoEpoch = false;
if(localStorage.getItem("autoEpoch")){ // wenn bereits im Speicher vorhanden
    autoEpoch = JSON.parse(localStorage.getItem("autoEpoch")); //JSON.parse() weil sonst ein String 
}
autoEpochCHECKBOX.checked = autoEpoch;


// Slider
const mutationSlider = document.getElementById("mutationSlider");
const mutationSliderValue = document.getElementById("mutationSliderValue");
// Slider auf den Wert des Local Storages setzen, sofern vorhanden
let t_MUTATE = 0.1;
if(localStorage.getItem("t_MUTATE")){
    t_MUTATE = localStorage.getItem("t_MUTATE");
}
mutationSlider.value = t_MUTATE * 100;
mutationSliderValue.innerHTML = mutationSlider.value + "%";


// Population Counter
const populationCounter = document.getElementById("populationCounter");
const populationSlider = document.getElementById("populationSlider");
const populationSliderValue = document.getElementById("populationSliderValue");
POPULATION = 100;
if(localStorage.getItem("POPULATION")){
    POPULATION = localStorage.getItem("POPULATION");
}
populationSlider.value = POPULATION;
populationSliderValue.innerHTML = POPULATION;



// Objects
let controlledAI;
let besteAI;
let straße;
let verkehr = [];
let aiCars = [];

//#endregionGlobals




//#region Klassen

class Controller {
    constructor(controlType){
        this.forward = false;
        this.left = false;
        this.right = false;
        this.reverse = false;

        // wenn es ein Dummy ist, soll er keine KeyListener bekommen
        switch(controlType){
            case "KEYS":
                this.#addKeyboardListener();
                break;
            case "DUMMY":
                this.forward = true;
                break;
        }
        
    }

    // private Methode
    #addKeyboardListener(){
        //wenn eine Taste gedrückt wird
        document.onkeydown=(e)=>{
            switch(e.key){
                case "ArrowLeft":
                    this.left=true;
                    break;
                case "ArrowRight":
                    this.right=true;
                    break;
                case "ArrowUp":
                    this.forward=true;
                    break;
                case "ArrowDown":
                    this.reverse=true;
                    break;
            }
        }
        //wenn eine Taste losgelassen wird
        document.onkeyup=(e)=>{
            switch(e.key){
                case "ArrowLeft":
                    this.left=false;
                    break;
                case "ArrowRight":
                    this.right=false;
                    break;
                case "ArrowUp":
                    this.forward=false;
                    break;
                case "ArrowDown":
                    this.reverse=false;
                    break;
            }
        }
    }//endOf #addKeyboardListener()

}//endOf Controller


class Car {
    constructor(x, y ,width, height, controlType, maxYspeed=3){
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.ySpeed = 0;
        this.angle = 0;
        this.acceleration = 0.1;
        this.maxYspeed = maxYspeed;
        if(controlType == "DUMMY"){
            this.maxYspeed = 0;
        }
        this.friction = 0.03;
        this.controller = new Controller(controlType);
        this.controlType = controlType;
        this.useBrain = controlType == "AI";

        // Wenn kein Dummy gib ihm Gehirn und Sensoren!
        if(controlType != "DUMMY"){
            this.sensor = new Sensor(this);
            this.brain = new NeuralNetwork([
                    this.sensor.rayCount,
                    6, // Hidden Neuronen
                    4 // Anz. möglicher Aktionen des Agents
                ]);
        }

        this.polygon = [];
        this.damaged = false;
    }

    update(roadBorders, verkehr){
        if(!this.damaged){
            this.#move();
            this.polygon = this.#createPolygon();
            this.damaged = this.#damageDetection(roadBorders, verkehr);

            if(this.sensor){
                this.sensor.update(roadBorders, verkehr); //damit Sensoren Collision berechnen können
                
                // Abstände als Inputs Brain geben, ansonsten 0
                // 1 - Abstand, weil die Inputs sollen kleine Werte für weit Entferntes bekommen und Hohe für Nahes
                const offsets = this.sensor.readings.map(ray => ray == null ? 0 : 1-ray.offset); // ray.offset ist bereits im Bereich [0,1]
                
                // Outputs vom Brain kriegen
                const outputs = NeuralNetwork.feedForward(offsets, this.brain);
                
                // Brain Controller geben
                if(this.useBrain){
                    this.controller.forward = outputs[0]; // funktioniert weil outputs immer "0" oder "1" sind -> Binärere Klassifizierer
                    this.controller.left = outputs[1];
                    this.controller.right = outputs[2];
                    this.controller.reverse = outputs[3];
                }
            }
        }
    }

    #damageDetection(roadBorders, verkehr){
        for(let i=0; i < roadBorders.length; i++){
            if(polysIntersect(this.polygon, roadBorders[i]) ){
                return true;
            }
        }
        for(let i=0; i < verkehr.length; i++){
            if(polysIntersect(this.polygon, verkehr[i].polygon) ){
                return true;
            }
        }
        return false;
    }

    // Für die Collision Detection müssen die 4 Punkte des Autos gefunden werden
    #createPolygon(){
        const points = []; // Man könnte auch mehr als 4 Punkte habe "Poly"-Gon
        // Trigonometrie mit Hypothenuse um den Abstand von der Mitte des Rechtecks zu einem Punkt zu berechnen (also Length der Diagonalen)
        const rad = Math.hypot(this.width, this.height) / 2; // 1. Winkel für Punktberechnung
        const alpha = Math.atan2(this.width, this.height); // 2. Winkel für Punktberechnung
        // Punkt oben Rechts
        points.push({
            x : this.x - Math.sin(this.angle - alpha) * rad,
            y : this.y - Math.cos(this.angle - alpha) * rad
        });
        points.push({ // oben links
            x : this.x - Math.sin(this.angle + alpha) * rad,
            y : this.y - Math.cos(this.angle + alpha) * rad
        });
        points.push({ // unten rechts
            x : this.x - Math.sin(Math.PI + this.angle - alpha) * rad,
            y : this.y - Math.cos(Math.PI + this.angle - alpha) * rad
        });
        points.push({ // unten links
            x : this.x - Math.sin(Math.PI + this.angle + alpha) * rad,
            y : this.y - Math.cos(Math.PI + this.angle + alpha) * rad
        });
        return points;
    }

    #move(){
        if(this.controller.forward){
            this.ySpeed += this.acceleration;
        }
        if(this.controller.reverse){
            this.ySpeed -= this.acceleration;
        }

        // Movement: OBEN und UNTEN
        //vorwärts & rückwärts ySpeed Begrenzung
        if(this.ySpeed > this.maxYspeed){
            this.ySpeed = this.maxYspeed;
        }
        if(this.ySpeed < -this.maxYspeed / 2){
            this.ySpeed = -this.maxYspeed / 2;
        }
        // Reibung damit wir nicht infinite beschleunigen
        if(this.ySpeed > 0){
            this.ySpeed -= this.friction;
        }
        if(this.ySpeed < 0){
            this.ySpeed += this.friction;
        }
        if(Math.abs(this.ySpeed) < this.friction){ //für den Fall dass ySpeed um friction herumhovert und nicht endet
            this.ySpeed=0;
        }

        // Anstatt Links und Rechts arbeiten wir mit Winkeln durch translate() und rotate()
        if(this.controller.right){
            this.angle -= 0.02;
        }
        if(this.controller.left){
            this.angle += 0.02;
        }

        // Position aktualisieren
        this.x-=Math.sin(this.angle)*this.ySpeed
        this.y-=Math.cos(this.angle)*this.ySpeed
    }

    draw(carColor, drawSensor=false, alpha=0.5){
        carCTX.save()

        // Sensor mit Rays zeichnen
        if(this.sensor && drawSensor){
            this.sensor.draw();
        }   

        carCTX.fillStyle = carColor;
        carCTX.globalAlpha = alpha;

        if(this.damaged){
            carCTX.fillStyle = 'red';
            carCTX.globalAlpha = 0.2;
        }

        carCTX.beginPath();
        carCTX.moveTo(this.polygon[0].x, this.polygon[0].y);
        for(let i=1; i < this.polygon.length; i++){
            carCTX.lineTo(this.polygon[i].x, this.polygon[i].y);
        }
        carCTX.fill();

        if(this.controlType != "DUMMY"){
            if (isAppleDevice()) {
                carCTX.font = '24px monospace';
              } else {
                carCTX.font = '24px Calibri';
              }
            
            carCTX.fillStyle = 'gray';
            const ySpeedText = this.ySpeed.toFixed(2);
            const textWidth = carCTX.measureText(ySpeedText).width;
            carCTX.fillText(ySpeedText, this.x - textWidth/2, this.y + 6); // Zeichne den Text "Auto" in der Mitte des Autos
        }
    }
}//endOf Car


class Road{
    constructor(x, width, laneCount=3){
        this.x = x;
        this.width = width;
        this.laneCount = laneCount;
        this.xLeft = x - width/2; //position ganz linkes x
        this.xRight = x + width/2;
        //road soll eig. infinite lang sein (nach oben y=0, also in y=-Bereich raus und unten y=window.height + Bereich)
        const infinity = 50000000; //workaround weil sonst weird bugs mit Math.Infinity und Dashes verschwinden z.B. so sinds 50.000.000 Pixel
        this.top = -infinity;
        this.bottom = infinity;

        // für zukünftig Runde Kurven
        // & für die Road-Border Detection
        this.topLeft = { x : this.xLeft, y : this.top }; // Position des Punktes am obersten Linken Straßenrand in (x,y) Format
        this.bottomLeft = { x : this.xLeft, y : this.bottom }; // Position des Punktes am untersten Linken Straßenrand in (x,y) Format
        this.topRight = { x : this.xRight, y : this.top }; // " "
        this.bottomRight = { x : this.xRight, y : this.bottom };
        // beinhaltet dann hinterher die positionen der Grenzen in (x,y) Format, dynamisch je nachdem wie breit die Lanes sind und die Straße, fancy!
        this.borders = [
            [this.topLeft, this.bottomLeft], // x,y linke Border
            [this.topRight, this.bottomRight] // x,y rechte Border
        ];
    }

    getLaneCenter(laneIndex){
        const laneWidth = this.width / this.laneCount; //Breite einer Lane
        return this.xLeft + laneWidth / 2 + laneIndex*laneWidth;
    }

    draw(){
        carCTX.lineWidth = 5;
        carCTX.strokeStyle = "white";

        // i Lanes in gleichem Abstand zeichnen
        for(let i=1; i<=this.laneCount-1; i++){
            // Position der zwischen Linien varriert je nach Anzahl deswegen Lineare Interpolierung
            const x = lerp(this.xLeft, this.xRight, i/this.laneCount); 

            // mittlere Linien weiß und gestrichelt
            carCTX.strokeStyle = "white";
            carCTX.setLineDash([30, 30]);

            carCTX.beginPath();
            carCTX.moveTo(x, this.top);
            carCTX.lineTo(x, this.bottom);
            carCTX.stroke();
        }

        // Straßenrand in grau und durchgezogen
        this.borders.forEach(border => { // geht die Border-Arrays durch
            carCTX.strokeStyle = "gray";
            carCTX.setLineDash([]);
            carCTX.beginPath();
            carCTX.moveTo(border[0].x, border[0].y); // erster Punkt der Border
            carCTX.lineTo(border[1].x, border[1].y); // zweiter Punkt 
            carCTX.stroke();
        });
    }
}//endOf Road


class Sensor{
    constructor(auto){
        this.auto = auto;
        this.rayCount = 7; //anz der "Fühler" pro Sensor
        this.rayLength = 300; //der Sensor kann nur in einem Radius von 100px "Sehen"
        this.raySpread = Math.PI / 2; //90° alle Rays befinden sich in diesem Bereich
        this.rays = [];
        this.readings = []; //beinhaltet die Messungen der Rays (Entfernung zu einer Border)
    }

    update(roadBorders, verkehr){
        this.#castRays();
        
        this.readings = []; // Messungen der Sensoren werden jedes Frame geleert/aktualisiert

        this.rays.forEach(ray => { // pushen eines Readings je Ray
            this.readings.push(this.#getReading(ray, roadBorders, verkehr)); 
        });


    }

    #getReading(ray, roadBorders, verkehr){  // messen wo der ray eine Border trifft
        let touches = []; // Schnittpunkte des Rays
        
        // prüfe für jede Border ob es Schnittpunkte gibt mit dem aktuellen ray
        for(let i=0; i < roadBorders.length; i++) {
            // man kann mit einem Strahl durch mehrere Objekte gehen und so mehrere Schnittpunkte haben, davon immer den nahesten nehmen, deswegen...
            const touch = getIntersection( //utility Function
                ray[0], // start
                ray[1], // ende
                roadBorders[i][0],
                roadBorders[i][1]
            ); 

            if(touch){
                touches.push(touch); // wenn es keine touches gibt, bleibt das Array einfach leer
            }
        }

        // prüfe Intersections für jeden Dummy mit aktuellem ray
        for(let i=0; i < verkehr.length; i++) {
            const carBorder = verkehr[i].polygon; // 4 (x,y) Koordinaten je Dummy
            // da wir bei einem Dummy nicht wie bei einer Border nur eine Linie haben, müssen wir für alle 4 checken
            for(let j=0; j< carBorder.length; j++){
                const touch = getIntersection(
                    ray[0], // start des aktuellen rays
                    ray[1], // ende des aktuellen rays
                    carBorder[j],
                    carBorder[(j+1) % carBorder.length] 
                );

                if(touch){
                    touches.push(touch);
                }
            }
        }

        // wenn keine touches
        if(touches.length == 0){
            return null;
        }
        else { // wenn wir einen Touch haben bekommen wir 3 Werte x, y der Position und den Abstand (offset) zur Position von getIntersaction()
            const offsets = touches.map(touch => touch.offset); // zieht aus allen touches nur den "offset" raus und baut daraus ein neues array "offsets"
            const minOffset = Math.min(...offsets); //min() nimmt normalerweise keine arrays an, aber "..." spreaded die Werte aus dem array raus
            return touches.find(touch => touch.offset == minOffset); // gib mir den Touch zurück der den minimal offset hat
        }
    }

    #castRays(){
        this.rays = []; // in jedem Frame, werden die Rays resetet

        for(let i=0; i < this.rayCount; i++){
            const rayAngle = this.auto.angle + lerp(
                this.raySpread/2, 
                -this.raySpread/2, 
                this.rayCount==1 ? 0.5 : i/(this.rayCount-1) // fix falls wir nur einen Ray haben wollen
                );
            
            // jeder Ray startet in der Mitte des Autos
            const start = { 
                x : this.auto.x, 
                y : this.auto.y
            }; 
            const end = {
                x : this.auto.x - Math.sin(rayAngle) * this.rayLength,
                y : this.auto.y - Math.cos(rayAngle) * this.rayLength
            };
            // berechneten Ray als Array dem rays-Array adden, weil wir es schon bei den Borders so gemacht haben und consistency in unserem Code wollen
            this.rays.push([start, end])
        }
    }

    draw(){
        for(let i=0; i < this.rayCount; i++){
            // Bevor wir die Rays zeichnen, checken wir ob ein Ray schneidet und verkürzen ihn entsprechend des Schnittpunktes mit einer Boarder
            let end = this.rays[i][1]; //alte End-Koordinate
            
            if(this.readings[i]){ // wenn es eine Collision, also Messung gibt
                end = this.readings[i];
            }

            // zeichnen bis zur Collision
            carCTX.beginPath();
            carCTX.lineWidth = 2;
            carCTX.strokeStyle = "yellow";
            carCTX.globalAlpha = 1;
            carCTX.moveTo( // [i][0] x von einem Ray
                this.rays[i][0].x, 
                this.rays[i][0].y
            );
            carCTX.lineTo( // [i][1] ist y von einem Ray
                end.x,
                end.y
            );
            carCTX.stroke();

            // zeichnen des Stücks nach einer Collision
            carCTX.beginPath();
            carCTX.lineWidth = 2;
            carCTX.strokeStyle = "red";
            carCTX.moveTo( // [i][0] x von einem Ray
                this.rays[i][1].x, 
                this.rays[i][1].y
            );
            carCTX.lineTo( // [i][1] ist y von einem Ray
                end.x,
                end.y
            );
            carCTX.stroke();
        }
    }
}//endOf Sensor

//#endregion Klassen



//#region Utility-Functions

// Lineare Interpolierungs Hilfs-Funktion
function lerp(A,B,t){
    // lerp ist quasi die funktion der gerade, kann aber auch auf alle Skalare innerhalb von nDimensinalen-Vektoren angewandt werden
    // wegen der Trendkomponente gut für Forecasting
    return A+(B-A)*t; // "t" ist der Interpolierungs-Faktor und gibt an in welche Richtung der neue Wert liegen soll, t=0 -> A, bei t=1 -> B
}

// Berechnet den Schnittpunkt zweier Geraden mittels Vektoren, wobei die erste Gerade aus den Punkten A, B besteht usw.
// Tutorial dafür: https://www.youtube.com/watch?v=fHOLQJo0FjQ&ab_channel=RaduMariescu-Istodor
function getIntersection(A,B,C,D){ 
    const tTop=(D.x-C.x)*(A.y-C.y)-(D.y-C.y)*(A.x-C.x);
    const uTop=(C.y-A.y)*(A.x-B.x)-(C.x-A.x)*(A.y-B.y);
    const bottom=(D.y-C.y)*(B.x-A.x)-(D.x-C.x)*(B.y-A.y);
    
    if(bottom!=0){
        const t=tTop/bottom;
        const u=uTop/bottom;
        if(t>=0 && t<=1 && u>=0 && u<=1){
            return {
                x:lerp(A.x,B.x,t),
                y:lerp(A.y,B.y,t),
                offset:t
            }
        }
    }
    return null;
}

// Collision Detection Util Funktion für Polygone
function polysIntersect(poly1, poly2){
    for(let i=0; i < poly1.length; i++){
        for(let j=0; j < poly2.length; j++){
            //workaround mit Modulo um index out of bounds zu vermeiden
            const touch = getIntersection(
                poly1[i],
                poly1[(i+1)%poly1.length], // mit dem Modulo bekommen wir wieder den ersten Punkt cuz 4 % 4 = 0
                poly2[j],
                poly2[(j+1)%poly2.length]
            );
            if(touch){
                return true;
            }
        }
    }
    return false;
}

function isAppleDevice(){
    const userAgent = navigator.userAgent;
    return /iPhone|iPad|iPod/.test(userAgent);
}

function exportBrain(){
    const jsonString = localStorage.getItem('besteAI');
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'brain.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function safeBrain(brain){
    localStorage.setItem("besteAI", JSON.stringify(brain)); // Gegenteil wäre JSON.parse()
}

function loadBrain(){
    // alle AIs bekommen das beste Brain der letzten Epoche, aber alle bis auf besteAI werden mutiert
    for(let i=0; i < aiCars.length; i++){
        aiCars[i].brain = JSON.parse(localStorage.getItem("besteAI"));

        // alle AIs mutieren um 10% bis auf erste AI
        if(i != 0){
            NeuralNetwork.mutate(aiCars[i].brain, t_MUTATE);
        }
    }
}


// mehrere nn Cars instanziieren
function generateCars(n){
    aiCars = [];
    for(let i=1; i <= n; i++){
        aiCars.push(new Car(straße.getLaneCenter(1), carCANVAS.height/2, 50, 75, "AI", 4) );
    }
    return aiCars;
}

function initObjects(){
    straße = new Road(carCANVAS.width/2, carCANVAS.width * 0.95, laneCount=3);// 0.95 für Abstand am Straßenrand
    controlledAI = new Car(straße.getLaneCenter(1), carCANVAS.height/2, 50, 75, "KEYS", 8);
    generateCars(POPULATION);
    besteAI = aiCars[0];

    // Dummy Array
    verkehr = [

        // 1. Welle
        new Car(straße.getLaneCenter(0), carCANVAS.height-600, 50, 75, "DUMMY"),
        new Car(straße.getLaneCenter(2), carCANVAS.height-600, 50, 75, "DUMMY"),
        new Car(straße.getLaneCenter(1), carCANVAS.height-900, 50, 200, "DUMMY"),

        // 2. Welle
        new Car(straße.getLaneCenter(0), carCANVAS.height-1400, 50, 75, "DUMMY"),
        new Car(straße.getLaneCenter(2), carCANVAS.height-1400, 50, 75, "DUMMY"),
        new Car(straße.getLaneCenter(1), carCANVAS.height-2000, 50, 200, "DUMMY"),

        // 3. Welle
        new Car(straße.getLaneCenter(0), carCANVAS.height-2400, 50, 75, "DUMMY"),
        new Car(straße.getLaneCenter(2), carCANVAS.height-2400, 50, 75, "DUMMY"),
        new Car(straße.getLaneCenter(1), carCANVAS.height-3000, 50, 75, "DUMMY"),

        // 4. Welle
        new Car(straße.getLaneCenter(0), carCANVAS.height-2800, 50, 75, "DUMMY"),
        new Car(straße.getLaneCenter(1), carCANVAS.height-2800, 50, 75, "DUMMY"),

        // 5. Welle
        new Car(straße.getLaneCenter(0), carCANVAS.height-3400, 50, 100, "DUMMY"),
        new Car(straße.getLaneCenter(2), carCANVAS.height-3400, 50, 75, "DUMMY"),

        // 6. Welle
        new Car(straße.getLaneCenter(2), carCANVAS.height-3500, 50, 50, "DUMMY"),
        new Car(straße.getLaneCenter(1), carCANVAS.height-3800, 50, 75, "DUMMY"),

        // 7. Welle
        new Car(straße.getLaneCenter(0)+20, carCANVAS.height-3800, 150, 75, "DUMMY"),

        // 8. Welle
        new Car(straße.getLaneCenter(2), carCANVAS.height-4500, 75, 75, "DUMMY"),
        new Car(straße.getLaneCenter(1), carCANVAS.height-5000, 75, 75, "DUMMY"),
        new Car(straße.getLaneCenter(2), carCANVAS.height-5500, 75, 75, "DUMMY"),
        new Car(straße.getLaneCenter(1), carCANVAS.height-6000, 75, 75, "DUMMY"),
        new Car(straße.getLaneCenter(0), carCANVAS.height-6300, 75, 75, "DUMMY")
    ];
}

//#endregion Utility-Functions





//#region Main

initObjects();
besteAI = aiCars[0];

// loadBrain
/// bevor Game startet, wird bestes brain von letzter epoche an alle agents übergeben
if(autoLoad && localStorage.getItem("besteAI")){ // wenn keine AI gesaved wurde, klappt der Button nicht
    loadBrain();
}

// Vergangene Zeit messen
let startTime = performance.now(); // Performance.now() liefert die vergangene Zeit seitdem die Seite geladen wurde in ms
let vergangeneZeit = 0;
let highScore = 0;
let highScore_every5sek = 0;

// Gameloop
animate();
function animate(time){
    requestAnimationFrame(animate);

    // canvas HÖHEN wenn Handy oder Desktop jedes Frame aktualisieren, anstatt "clearRect", denn das Ändern der Größe eines Canvas automatisch seinen Inhalt löscht
    if (window.innerWidth <= 1000){
        carCANVAS.height = window.innerHeight;
        nnCANVAS.height = window.innerHeight * 0.7;
    }
    else{
        carCANVAS.height = window.innerHeight;
        nnCANVAS.height = window.innerHeight * 0.7;
    }

    // AUTO EPOCH
    // Vergangen Zeit messen in Sek.
    if(time - startTime >= 1000){
        vergangeneZeit += 1;

        if(vergangeneZeit % 4 == 0){

            // wenn die letzten 4 Sek. keine 500px progess dann nächste Epoche
            if(autoEpoch && highScore > (highScore_every5sek-500) ){
                // save best brain
                safeBrain(besteAI.brain);
                // restart
                location.reload();
            }

            // update der 4 Sek für nächsten Check
            highScore_every5sek = highScore;
        }
        
        console.log("vergangeneZeit: ",vergangeneZeit, "highScore: ",highScore);
        startTime = performance.now();
    }
   
    

    // UPDATEN
    // Auto Daten je Frame aktualisieren
    controlledAI.update(straße.borders, verkehr); // übergabe der Straßenränder und DUMMY's für Collision Detection
    aiCars.forEach(ai => ai.update(straße.borders, verkehr));

    // Verkehr updaten
    verkehr.forEach(gegner => {gegner.update(straße.borders, [])} ); // Dummys dürfen nicht mit sich selber Colliden deswegen leeres Array weil der Verkehr nicht gechecked wird


    // Populations Counter
    anzCarsTot = (aiCars.filter(car => car.damaged)).length;
    populationCounter.innerText = "Population: " + (POPULATION - anzCarsTot);

    // FITNESS FUNCTION
    aiCars.forEach(ai => {
        if(ai.y <= besteAI.y){
            besteAI = ai;
            highScore = besteAI.y;
        }
    });

    // Kamera Perspektive
    carCTX.save(); // speichern des Canvas-Stacks bis jetzt
    if (STEUERN) {
        carCTX.translate(0, -controlledAI.y + carCANVAS.height * 0.6);
    }
    else if (!viewSPAWN){
        carCTX.translate(0, - besteAI.y + carCANVAS.height * 0.6); //alles wird um die Position des Autos verschoben, somit wird alles relativ zur aktuellen Position des Autos gezeichnet  
    }
    else if (viewSPAWN) {
        carCTX.translate(0, carCANVAS.height * 0.6); //Am Spawn stehen bleiben
    } 
    

    // DRAWN
    straße.draw();
    verkehr.forEach(gegner => {gegner.draw("orange", false, alpha=1)});
    besteAI.draw("blue", true, 1); // true ist für Sensor
    aiCars.forEach(ai => ai.draw("black", false, 0.7) );
    if(STEUERN){
        controlledAI.draw("lawngreen", true, 1);
    }
    carCTX.restore(); //die ursprüngliche x,y Verschiebung wird resetet also die Zeichnungen des alten Stacks "addiert"
    
    // NN zeichnen
    nnCTX.lineDashOffset = -time/50;
    if(STEUERN){
        Visualizer.drawNetwork(nnCTX, controlledAI.brain);
    }else{
        Visualizer.drawNetwork(nnCTX, besteAI.brain);
    }
}
//#endregion Main





//#region EventListener

populationSlider.oninput = () => {
    populationSliderValue.innerHTML = populationSlider.value;
    localStorage.setItem("POPULATION", populationSlider.value);
}

// Epoch neuladen
restartBTN.onclick = () => {
    location.reload(); // schlecheter Workaround anstatt von initObjects, weil sonst bugs mit den Translates oben
}
// Auto Load Checkbox
autoEpochCHECKBOX.onchange = e =>  {
    if(e.target.checked){
        autoEpoch = true;
        localStorage.setItem("autoEpoch", autoEpoch);
    }else{
        autoEpoch = false;
        localStorage.setItem("autoEpoch", autoEpoch);
    }
};

// bestes Brain als JSON saven
saveBTN.onclick = () => {
    safeBrain(besteAI.brain);

    // Anz Layers herausfinden
    numberNeurons = 0;
    numberWeights = 0;
    for(let i=0; i < besteAI.brain.denseLayers.length; i++){
        numberNeurons += besteAI.brain.denseLayers[i].weights.length;
    }

    alert("Brain gespeichert! \n\n" 
        + "Layers: " + besteAI.brain.denseLayers.length +"\n"
        + "Neurons: " + numberNeurons
    );
}

mutationSlider.oninput = () => {
    mutationSliderValue.innerHTML = mutationSlider.value + "%";
    t_MUTATE = mutationSlider.value / 100;
    localStorage.setItem("t_MUTATE", t_MUTATE);
}

// Load Brain
// Auto Load Checkbox
autoLoadCHECKBOX.onchange = e =>  {
    if(e.target.checked){
        autoLoad = true;
        localStorage.setItem("autoLoad", autoLoad);
    }else{
        autoLoad = false;
        localStorage.setItem("autoLoad", autoLoad);
    }
};
// Load Button
loadBTN.onclick =  () => {
    loadBrain();
}

// Brain to JSON
exportBTN.onclick =  () => {
    exportBrain();
}

// Reset 
resetBTN.onclick =  () => {
    // Checkboxen disablen
    localStorage.setItem("autoEpoch", false);
    localStorage.setItem("autoLoad", false);
    localStorage.setItem("besteAI", null);
    location.reload();
}



// besten Kandidaten killen
killBTN.onclick = () => {
    besteAI.damaged = true;
}

// spawn view Button
spawnViewBTN.onclick = () => {
    // für toggle zwischen Spawn und bester AI
    if(viewSPAWN){
        viewSPAWN = false;
        spawnViewBTN.style.background = "white";
    }else{
        viewSPAWN = true;
        spawnViewBTN.style.background = "lawngreen";
    }
}

// selber Steuerung übernehmen
controllerBTN.onclick = () => {
    if(STEUERN){
        STEUERN = false;
        controllerBTN.style.background = "white";
        // Spawn Button deaktivieren, weil sowieso nicht clickable wenn Controller an
        spawnViewBTN.style.background = "white";
        spawnViewBTN.disabled = false;
    }else{
        STEUERN = true;
        controllerBTN.style.background = "lawngreen";
        // Spawn Button deaktivieren, weil sowieso nicht clickable wenn Controller an
        spawnViewBTN.style.background = "gray";
        spawnViewBTN.disabled = true;
    }
    controlledAI.ySpeed = 0;
    controlledAI.x = carCANVAS.width / 2;;
    controlledAI.y = carCANVAS.height / 2;
    controlledAI.brain = besteAI.brain;
}

//#endregion EventListener