//#region Gobals

const CANVAS = document.getElementById("carCanvas");
CANVAS.height = window.innerHeight;
CANVAS.width = 200;

//#endregionGlobals



//#region Klassen

class Car {
    constructor(x, y ,width, height){
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    draw(ctx){
        ctx.beginPath();
        ctx.rect(this.x - this.width/2, this.y-this.height/2, this.width, this.height);
        ctx.fill();
    }
}

//#endregion Klassen



//#region Funktionen
//#endregion Funktionen



//#region Main

const ctx = CANVAS.getContext("2d");
auto = new Car(CANVAS.width/2, CANVAS.height/2, 50, 75);
auto.draw(ctx);

//#endregion Main



//#region EventListener
//#endregion EventListener