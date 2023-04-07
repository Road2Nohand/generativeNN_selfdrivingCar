class NeuralNetwork {
    constructor(anzNeuronenJeLayer){
        this.denseLayers = [];
        for(let i=0; i < anzNeuronenJeLayer.length-1; i++){
            this.denseLayers.push(new DenseLayer(anzNeuronenJeLayer[i], anzNeuronenJeLayer[i+1]) ); // i+1 ergibt beim letzten Layer ein leeres Array mit [undefined]
        }
    }

    static feedForward(inputs, network){
        let outputs = DenseLayer.feedForward(inputs, network.denseLayers[0]);
        // durch übrige Layer iterieren und erste Outputs mitgeben
        for(let i=1; i < network.denseLayers.length; i++){
            outputs = DenseLayer.feedForward(outputs, network.denseLayers[i]);
        }
        return outputs;
    }
}



class DenseLayer {
    constructor(anzInputNeuronen, anzOutputNeuronen){
        this.inputs = new Array(anzInputNeuronen);
        this.outputs = new Array(anzOutputNeuronen);
        this.biases = new Array(anzOutputNeuronen);

        this.weights = [];
        for(let i=0; i < anzInputNeuronen; i++){
            // je Input Neuron ein Gewichts-Array auf alle Output-Neuronen
            this.weights[i] = new Array(anzOutputNeuronen);
        }
        //wird bei der Erstellung einer Klasse direkt ausgeführt
        DenseLayer.#randomize(this);
    } 

    // static weil entkoppelt von der Klasse, kann so auch nicht auf "this" zugreifen -> entkoppelt von der Klasse
    static #randomize(layer){
        // [-1,1] Gewichte
        for(let i=0; i < layer.inputs.length; i++){
            for(let j=0; j < layer.outputs.length; j++){
                layer.weights[i][j] = Math.random()*2-1; //random() liefert Wert in [0,1] * 2 -1 -> [-1,1]
            }
        }

        // [-1,1] Biases
        for(let i=0; i < layer.outputs.length; i++){
            layer.biases[i] = Math.random()*2-1;
        }
    }

    static feedForward(givenInputs, layer){
        for(let i=0; i < layer.inputs.length; i++){
            layer.inputs[i] = givenInputs[i];
        }

        for(let i=0; i < layer.outputs.length; i++){
            let sum = 0;
            for(let j=0; j < layer.inputs.length; j++){
                sum += layer.inputs[j] * layer.weights[j][i];
            }
            
            // bias als Schwellwert anstatt Aktivierungsfunktion -> "Heaviside-Funktion" H(t) = { 0, wenn t < 0  |  1, wenn t > 0 }
            // dadurch das wir NEAT verwenden, werden die Biases solange gewurschtelt bis man die richtige Ausgabe hat
            // Und es kommt kein Gradienten-Verfahren zum Einsatz 
            // ist hier sinnvoll, weil wir nur ein binäres Klassifikations Problem haben: wenn Objekt dann ausweichen
            if(sum > layer.biases[i]){
                layer.outputs[i] = 1;
            }else{
                layer.outputs[i] = 0;
            }
        }

        return layer.outputs;
    }
}




function getRGBA(value){
    const alpha=Math.abs(value);
    const R=value<0?0:255;
    const G=R;
    const B=value>0?0:255;
    return "rgba("+R+","+G+","+B+","+alpha+")";
}﻿


class Visualizer{
    static drawNetwork(ctx,network){
        const margin=50;
        const left=margin;
        const top=margin;
        const width=ctx.canvas.width-margin*2;
        const height=ctx.canvas.height-margin*2;

        const levelHeight=height/network.denseLayers.length;

        for(let i=network.denseLayers.length-1;i>=0;i--){
            const levelTop=top+
                lerp(
                    height-levelHeight,
                    0,
                    network.denseLayers.length==1
                        ?0.5
                        :i/(network.denseLayers.length-1)
                );

            ctx.setLineDash([7,3]);
            Visualizer.drawLevel(ctx,network.denseLayers[i],
                left,levelTop,
                width,levelHeight,
                i==network.denseLayers.length-1
                    ?['🠉','🠈','🠊','🠋']
                    :[]
            );
        }
    }

    static drawLevel(ctx,level,left,top,width,height,outputLabels){
        const right=left+width;
        const bottom=top+height;

        const {inputs,outputs,weights,biases}=level;

        for(let i=0;i<inputs.length;i++){
            for(let j=0;j<outputs.length;j++){
                ctx.beginPath();
                ctx.moveTo(
                    Visualizer.#getNodeX(inputs,i,left,right),
                    bottom
                );
                ctx.lineTo(
                    Visualizer.#getNodeX(outputs,j,left,right),
                    top
                );
                ctx.lineWidth=2;
                ctx.strokeStyle=getRGBA(weights[i][j]);
                ctx.stroke();
            }
        }

        const nodeRadius=18;
        for(let i=0;i<inputs.length;i++){
            const x=Visualizer.#getNodeX(inputs,i,left,right);
            ctx.beginPath();
            ctx.arc(x,bottom,nodeRadius,0,Math.PI*2);
            ctx.fillStyle="black";
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x,bottom,nodeRadius*0.6,0,Math.PI*2);
            ctx.fillStyle=getRGBA(inputs[i]);
            ctx.fill();
        }
        
        for(let i=0;i<outputs.length;i++){
            const x=Visualizer.#getNodeX(outputs,i,left,right);
            ctx.beginPath();
            ctx.arc(x,top,nodeRadius,0,Math.PI*2);
            ctx.fillStyle="black";
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x,top,nodeRadius*0.6,0,Math.PI*2);
            ctx.fillStyle=getRGBA(outputs[i]);
            ctx.fill();

            ctx.beginPath();
            ctx.lineWidth=2;
            ctx.arc(x,top,nodeRadius*0.8,0,Math.PI*2);
            ctx.strokeStyle=getRGBA(biases[i]);
            ctx.setLineDash([3,3]);
            ctx.stroke();
            ctx.setLineDash([]);

            if(outputLabels[i]){
                ctx.beginPath();
                ctx.textAlign="center";
                ctx.textBaseline="middle";
                ctx.fillStyle="black";
                ctx.strokeStyle="white";
                ctx.font=(nodeRadius*1.5)+"px Arial";
                ctx.fillText(outputLabels[i],x,top+nodeRadius*0.1);
                ctx.lineWidth=0.5;
                ctx.strokeText(outputLabels[i],x,top+nodeRadius*0.1);
            }
        }
    }

    static #getNodeX(nodes,index,left,right){
        return lerp(
            left,
            right,
            nodes.length==1
                ?0.5
                :index/(nodes.length-1)
        );
    }
}