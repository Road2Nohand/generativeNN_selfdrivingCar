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
        this.friction = 0.05;
        this.controller = new Controller();
    }

    update(){
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
        CTX.translate(this.x, this.y) //gibt an zu welchen Punkt wir gehen wollen
        CTX.rotate(-this.angle)

        CTX.beginPath();
        CTX.rect(-this.width/2, -this.height/2, this.width, this.height);
        CTX.fillStyle = 'black';
        CTX.fill();

        // ySpeed in die Mitte des Autos
        CTX.font = '24px Calibri';
        CTX.fillStyle = 'white';
        const ySpeedText = this.ySpeed.toFixed(2);
        const textWidth = CTX.measureText(ySpeedText).width; // Messe die Breite des Textes, um ihn zentriert zu zeichnen        
        CTX.fillText(ySpeedText, -textWidth / 2, 0); // Zeichne den Text "Auto" in der Mitte des Autos

        CTX.restore(); //für das translate(), alles bis hier hin wird gedreht
    }
}//endOf Car

//#endregion Klassen



//#region Funktionen
//#endregion Funktionen



//#region Main

auto = new Car(CANVAS.width/2, CANVAS.height/2, 50, 75);

// Gameloop
animate();
function animate(){
    auto.update();

    CTX.clearRect(0,0, CANVAS.width, CANVAS.height);
    
    auto.draw();
    requestAnimationFrame(animate);
}

//#endregion Main



//#region EventListener

// wenn man die Fenster-Größe verändert
window.addEventListener("resize", () => {
    CANVAS.height = window.innerHeight;
    CANVAS.width = 200;
});

//#endregion EventListener