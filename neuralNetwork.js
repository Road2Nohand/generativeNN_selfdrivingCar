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




dense1 = new DenseLayer(2,3);