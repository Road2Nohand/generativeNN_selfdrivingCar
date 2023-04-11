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

    // bei t_amount = 1 bekommen wir einen komplett neuen Wert, ansonsten zwischen altem und random [-1,1]
    static mutate(network, t_amount=1){
        network.denseLayers.forEach(layer => {

            //biases mutieren
            for(let i=0; i < layer.biases.length; i++){
                layer.biases[i] = lerp(
                    layer.biases[i], 
                    Math.random()*2-1,
                    t_amount
                    );
            }

            //weights mutieren
            for(let i=0; i < layer.weights.length; i++){
                //weights je Neuron
                for(let j=0; j < layer.weights.length; j++){
                    layer.weights[i][j] = lerp(
                        layer.weights[i][j],
                        Math.random()*2-1,
                        t_amount
                    );
                }
            }
        });
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
}



class Visualizer{
    static drawNetwork(nnCTX, network){
        const margin = 40;
        const left = margin;
        const top = margin;
        const width = nnCTX.canvas.width - margin*2;
        const height = nnCTX.canvas.height - margin*2;

        Visualizer.drawLayer(
            nnCTX, 
            network.denseLayers[0],
            left,
            top,
            width,
            height
            );
    }

    static drawLayer(nnCTX, layer, left, top, width, height){
        const right = left + width;
        const bottom = top + height;
        const neuronRadius = 20; //mit einem margin von 40px mit 20px Abstand zum Rand
        const {inputs, outputs, weights} = layer; // Attribute aus einem Array in einzelne Variablen mit der "Destrukturierungs Syntax"

        // Connections (zuerst damit sie unterhalb der Kreise gezeichnet werden)
        for(let i=0; i < inputs.length; i++){
            for(let o=0; o < outputs.length; o++){
                nnCTX.beginPath();
                nnCTX.moveTo(Visualizer.#getNeuronX(inputs, i, left, right), bottom);
                nnCTX.lineTo(Visualizer.#getNeuronX(outputs, o, left, right), top);
                // Zeichnen der Wheights in ihrer Stärke
                const value = weights[i][o] * inputs[i];
                const alpha  = Math.abs(value); // wenn Wheight=0, wollen wir es auch nicht sehen, wenn stark gereizt durch input, stärker zeichen
                const R = value <= 0 ? 255 : 255; // wenn negativ dann rot
                // wenn positiv dann weiß
                const G = value > 0 ? 255 : 0;
                const B = value > 0 ? 255 : 0;
                nnCTX.strokeStyle = "rgba(" +R+ "," +G+ "," +B+ "," +alpha+ ")";
                nnCTX.lineWidth = 2;
                nnCTX.stroke();
            }
        }

        // Inputs
        for(let i=0; i < inputs.length; i++){
            const x = Visualizer.#getNeuronX(inputs, i, left, right);
            // Kreis zeichnen
            nnCTX.beginPath();
            nnCTX.arc(x, bottom, neuronRadius, 0, Math.PI*2);
            nnCTX.fillStyle = "white";
            nnCTX.fill();
        }

        // Outputs
        for(let o=0; o < outputs.length; o++){
            const x = Visualizer.#getNeuronX(outputs, o, left, right);

            // Kreis zeichnen
            nnCTX.beginPath();
            nnCTX.arc(x, top, neuronRadius, 0, Math.PI*2); // hier bräuchte man eine Abfrage, wie viele Layer noch folgen und dann mit lerp und hight, anstatt von "top"
            nnCTX.fillStyle = "white";
            nnCTX.fill();
        }

    }//drawLayer


    static #getNeuronX(neurons, index, left, right){
        // X Position eines Neurons bei gleichemäßiger Verteilung mittels Linearer Interpolierung
        const t = neurons.length == 1 ? 0.5 : index/(neurons.length-1); // 0.5 falls nur ein Neuron, weil sonst 1
        return lerp(left, right, t);
    }


}//endOF class Visualizer