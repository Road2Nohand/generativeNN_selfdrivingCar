//#region Gobals

const CANVAS = document.getElementById("carCanvas");
CANVAS.height = window.innerHeight;
CANVAS.width = 400;
const CTX = CANVAS.getContext("2d");

//#endregionGlobals



//#region Klassen

class Controller {
    constructor(){
        this.forward = false;
        this.left = false;
        this.right = false;
        this.reverse = false;
        this.#addKeyboardListener();
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
    constructor(x, y ,width, height){
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.ySpeed = 0;
        this.angle = 0;
        this.acceleration = 0.1;
        this.maxYspeed = 3;
        this.friction = 0.03;
        this.controller = new Controller();
        this.sensor = new Sensor(this);
        this.polygon = [];
        this.damaged = false;
    }

    update(roadBorders){
        this.#move();
        this.polygon = this.#createPolygon();
        this.damaged = this.#damageDetection(roadBorders);
        this.sensor.update(roadBorders); //damit Sensoren Collision berechnen können
    }

    #damageDetection(roadBorders){
        for(let i=0; i < roadBorders.length; i++){
            if(polysIntersect(this.polygon, roadBorders[i]) ){
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

    draw(){
        CTX.save()

        // Sensor mit Rays zeichnen
        this.sensor.draw();

        // Neue Auto zeichnen Methode mit #createPolygon
        if(this.damaged){
            CTX.fillStyle = 'red';
        }
        else {
            CTX.fillStyle = 'black';
        }
        CTX.beginPath();
        CTX.moveTo(this.polygon[0].x, this.polygon[0].y);
        for(let i=1; i < this.polygon.length; i++){
            CTX.lineTo(this.polygon[i].x, this.polygon[i].y);
        }
        CTX.fill();

        // Alte Auto zeichnen Methode mit rect() 
        // CTX.beginPath();
        // CTX.rect(-this.width/2, -this.height/2, this.width, this.height);
        // CTX.fillStyle = 'black';
        // CTX.fill();

        CTX.font = '24px Calibri';
        CTX.fillStyle = 'white';
        const ySpeedText = this.ySpeed.toFixed(2);
        const textWidth = CTX.measureText(ySpeedText).width; // Messe die Breite des Textes, um ihn zentriert zu zeichnen 
        CTX.fillText(ySpeedText, this.x - textWidth/2, this.y + 6); // Zeichne den Text "Auto" in der Mitte des Autos
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
        CTX.lineWidth = 5;
        CTX.strokeStyle = "white";

        // i Lanes in gleichem Abstand zeichnen
        for(let i=1; i<=this.laneCount-1; i++){
            // Position der zwischen Linien varriert je nach Anzahl deswegen Lineare Interpolierung
            const x = lerp(this.xLeft, this.xRight, i/this.laneCount); 

            // mittlere Linien weiß und gestrichelt
            CTX.strokeStyle = "white";
            CTX.setLineDash([30, 30]);

            CTX.beginPath();
            CTX.moveTo(x, this.top);
            CTX.lineTo(x, this.bottom);
            CTX.stroke();
        }

        // Straßenrand in grau und durchgezogen
        this.borders.forEach(border => { // geht die Border-Arrays durch
            CTX.strokeStyle = "gray";
            CTX.setLineDash([]);
            CTX.beginPath();
            CTX.moveTo(border[0].x, border[0].y); // erster Punkt der Border
            CTX.lineTo(border[1].x, border[1].y); // zweiter Punkt 
            CTX.stroke();
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

    update(roadBorders){
        this.#castRays();
        
        this.readings = []; // Messungen der Sensoren werden jedes Frame geleert/aktualisiert

        this.rays.forEach(ray => { // pushen eines Readings je Ray
            this.readings.push(this.#getReading(ray, roadBorders)); 
        });


    }

    #getReading(ray, roadBorders){  // messen wo der ray eine Border trifft
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

            const start = { // jeder Ray startet in der Mitte des Autos
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
            CTX.beginPath();
            CTX.lineWidth = 2;
            CTX.strokeStyle = "yellow";
            CTX.moveTo( // [i][0] x von einem Ray
                this.rays[i][0].x, 
                this.rays[i][0].y
            );
            CTX.lineTo( // [i][1] ist y von einem Ray
                end.x,
                end.y
            );
            CTX.stroke();

            // zeichnen des Stücks nach einer Collision
            CTX.beginPath();
            CTX.lineWidth = 2;
            CTX.strokeStyle = "red";
            CTX.moveTo( // [i][0] x von einem Ray
                this.rays[i][1].x, 
                this.rays[i][1].y
            );
            CTX.lineTo( // [i][1] ist y von einem Ray
                end.x,
                end.y
            );
            CTX.stroke();
        }
    }
}//endOf Sensor

//#endregion Klassen



//#region Utility-Functions

// Lineare Interpolierungs Hilfs-Funktion
function lerp(A,B,t){
    return A+(B-A)*t;
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
function polysIntersect(poly1, poly2) {
    for(let i=0; i < poly1.length; i++){
        for(let j=0; j < poly2.length; j++){
            //workaround mit Modulo um index out of bounds zu vermeiden
            const touch = getIntersection(
                poly1[i],
                poly1[(i+1)%poly1.length], 
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

//#endregionUtility-Functions




//#region Main

const straße = new Road(CANVAS.width/2, CANVAS.width * 0.95, laneCount=4);// 0.95 für Abstand am Straßenrand
const auto = new Car(straße.getLaneCenter(1), CANVAS.height/2, 50, 75);

// Gameloop
animate();
function animate(){

    // Auto Daten je Frame aktualisieren
    auto.update(straße.borders); // übergabe der Straßenränder, für Collision Detection

    CANVAS.height = window.innerHeight; // anstatt "clearRect", denn das Ändern der Größe eines Canvas automatisch seinen Inhalt löscht

    // Nur das Zeichen der Straße und des Autos werden um x,y verschoben
    CTX.save(); // speichern des Canvas-Stacks bis jetzt

    CTX.translate(0, - auto.y + CANVAS.height * 0.7); //alles wird um die Position des Autos verschoben, somit wird alles relativ zur aktuellen Position des Autos gezeichnet  

    straße.draw();
    auto.draw();

    CTX.restore(); // //die ursprüngliche x,y Verschiebung wird resetet also die Zeichnungen des alten Stacks "addiert"
    
    requestAnimationFrame(animate);
}

//#endregion Main




//#region EventListener

// wenn man die Fenster-Größe verändert
window.addEventListener("resize", () => {
    CANVAS.height = window.innerHeight;
});

//#endregion EventListener