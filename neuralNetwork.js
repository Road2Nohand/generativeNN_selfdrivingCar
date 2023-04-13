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



class Visualizer{

    static drawNetwork(nnCTX, network){
        const margin = 60;
        const left = margin;
        const top = margin;
        const width = nnCTX.canvas.width - margin*2;
        const height = nnCTX.canvas.height - margin*2;

        const layerHeight = height / network.denseLayers.length;

        // gehen durch alle layer bis auf "2" durch, man achte auf das "<"
        for(let i=0; i < network.denseLayers.length; i++){
            let t = network.denseLayers.length == 1 ? 0.5 : i/(network.denseLayers.length-1);
            const layerTop = top + lerp(height-layerHeight, 0, t);

            Visualizer.drawLayer(nnCTX, network.denseLayers[i], left, layerTop, width, layerHeight);
        }
    }

    static getRGBA(value){
        const alpha=Math.abs(value);
        const R = value <= 0 ? 255 : 255; // wenn negativ dann rot
        // wenn positiv dann weiß
        const G = value > 0 ? 255 : 0;
        const B = value > 0 ? 255 : 0;
        return "rgba("+R+","+G+","+B+","+alpha+")";
    }

    static #getNeuronX(neurons, index, left, right){
        // X Position eines Neurons bei gleichemäßiger Verteilung mittels Linearer Interpolierung
        const t = neurons.length == 1 ? 0.5 : index/(neurons.length-1); // 0.5 falls nur ein Neuron, weil sonst 1
        return lerp(left, right, t);
    }
    

    static drawLayer(nnCTX, layer, left, top, width, height){
        const right = left + width;
        const bottom = top + height;
        const neuronRadius = 15; //mit einem margin von 40px mit 20px Abstand zum Rand
        const {inputs, outputs, weights, biases} = layer; // Attribute aus einem Array in einzelne Variablen mit der "Destrukturierungs Syntax"

        // Connections (zuerst damit sie unterhalb der Kreise gezeichnet werden)
        for(let i=0; i < inputs.length; i++){
            for(let o=0; o < outputs.length; o++){
                nnCTX.beginPath();
                nnCTX.moveTo(Visualizer.#getNeuronX(inputs, i, left, right), bottom);
                nnCTX.lineTo(Visualizer.#getNeuronX(outputs, o, left, right), top);
                // Zeichnen der Wheights in ihrer Stärke
                let value = weights[i][o] * inputs[i]; // wenn Wheight=0, wollen wir es auch nicht sehen, wenn stark gereizt durch input, stärker zeichen
                // immer etwas Wert adden damit man immer etwas opacity hat
                value += value < 0 ? -0.05 : 0.05; // kann man immer drauf adden weil die Inputs maximal ~0.85 werden aufgrund des Korpus der Cars
                nnCTX.strokeStyle = Visualizer.getRGBA(value);
                nnCTX.lineWidth = 2;
                nnCTX.stroke();
            }
        }

        // Inputs
        for(let i=0; i < inputs.length; i++){
            const x = Visualizer.#getNeuronX(inputs, i, left, right);
            // Schwarzer breiterer Kreis um Connections zu überzeichnen
            nnCTX.beginPath();
            nnCTX.arc(x, bottom, neuronRadius+5, 0, Math.PI*2);
            nnCTX.fillStyle = "black";
            nnCTX.fill();

            // Kreis zeichnen
            nnCTX.beginPath();
            nnCTX.arc(x, bottom, neuronRadius, 0, Math.PI*2);
            // Weiß füllen je nach Input Reiz
            nnCTX.fillStyle = Visualizer.getRGBA(inputs[i]);
            nnCTX.fill();
            // dauerhaften weißen Stroke:
            nnCTX.strokeStyle = "white";
            nnCTX.lineWidth = 1;
            nnCTX.stroke();
        }

        // Outputs
        for(let o=0; o < outputs.length; o++){
            const x = Visualizer.#getNeuronX(outputs, o, left, right);

            // Schwarzer breiterer Kreis um Connections zu überzeichnen
            nnCTX.beginPath();
            nnCTX.arc(x, top, neuronRadius+15, 0, Math.PI*2);
            nnCTX.fillStyle = "black";
            nnCTX.fill();

            // Aktionen
            // wenn es der letzte Layer ist, Aktionen über die Neuronen schreiben
            if(outputs.length == 4){
                let aktionen = ["Up", "Left", "Right", "Down"];
                nnCTX.font = "24px Calibri";
                nnCTX.fillStyle = 'white';
                let text = aktionen[o];
                const textWidth = carCTX.measureText(text).width;
                nnCTX.fillText(text, x - (textWidth/2), 25);
            }

            // Kreis zeichnen
            nnCTX.beginPath();
            nnCTX.arc(x, top, neuronRadius, 0, Math.PI*2); // hier bräuchte man eine Abfrage, wie viele Layer noch folgen und dann mit lerp und hight, anstatt von "top"
            // Füllen wenn feuert
            nnCTX.fillStyle = Visualizer.getRGBA(outputs[o]);
            nnCTX.fill();
            // dauerhaften weißen Stroke:
            nnCTX.strokeStyle = "white";
            nnCTX.lineWidth = 1;
            nnCTX.stroke();

            // Biases als Stroke zeichnen
            nnCTX.beginPath();
            nnCTX.lineWidth = 3;
            // Zeichnen der Biases nach ihrem Wert, gefeuert wird immer wenn die sum(W*I) > b ist, sprich sehr rot, brauch das Neuron viele negative Eingänge
            let value = biases[o];
            nnCTX.strokeStyle = Visualizer.getRGBA(value);
            nnCTX.arc(x, top, neuronRadius + 6, 0, Math.PI*2);
            nnCTX.setLineDash([6,6]);
            nnCTX.stroke();
            nnCTX.setLineDash([]);
        }

    }//drawLayer


}//endOF class Visualizer