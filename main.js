//#region Gobals

const CANVAS = document.getElementById("carCanvas");
CANVAS.height = window.innerHeight;
CANVAS.width = 200;
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
        this.speed = 0;
        this.acceleration = 0.1;
        this.maxSpeed = 3;
        this.friction = 0.02;
        this.controller = new Controller();
    }

    update(){
        if(this.controller.forward){
            this.speed += this.acceleration;
        }
        if(this.controller.reverse){
            this.speed -= this.acceleration;
        }

        //vorwärts & rückwärts Speed Begrenzung
        if(this.speed > this.maxSpeed){
            this.speed = this.maxSpeed;
        }
        if(this.speed < -this.maxSpeed / 2){
            this.speed = -this.maxSpeed / 2;
        }
        // Reibung damit wir nicht infinite beschleunigen
        if(this.speed > 0){
            this.speed -= this.friction;
        }
        if(this.speed < 0){
            this.speed += this.friction;
        }
        if(Math.abs(this.speed) < this.friction){ //für den Fall dass speed um friction herumhovert und nicht endet
            this.speed=0;
        }
        this.y -= this.speed; // Speed aktualisieren
    }

    draw(){
        CTX.beginPath();
        CTX.rect(this.x - this.width/2, this.y-this.height/2, this.width, this.height);
        CTX.fillStyle = 'black';
        CTX.fill();

        // Speed in die Mitte des Autos
        CTX.font = '24px Calibri';
        CTX.fillStyle = 'white';
        const speedText = this.speed.toFixed(2);
        const textWidth = CTX.measureText(speedText).width; // Messe die Breite des Textes, um ihn zentriert zu zeichnen        
        CTX.fillText(speedText, this.x - textWidth / 2, this.y + this.height / 7); // Zeichne den Text "Auto" in der Mitte des Autos
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