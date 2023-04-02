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
    }

}//endOf Controller


class Car {
    constructor(x, y ,width, height){
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.controller = new Controller();
    }

    update(){
        if(this.controller.forward){
            this.y -= 2;
        }
        if(this.controller.reverse){
            this.y += 2;
        }
    }

    draw(){
        CTX.beginPath();
        CTX.rect(this.x - this.width/2, this.y-this.height/2, this.width, this.height);
        CTX.fill();
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