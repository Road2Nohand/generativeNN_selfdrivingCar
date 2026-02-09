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

    static uniformCrossover(parent1, parent2) {
        // Annahme: beide Eltern haben die gleiche Netzwerkstruktur
        const anzNeuronenJeLayer = parent1.denseLayers.map(layer => layer.outputs.length);
        const child = new NeuralNetwork(anzNeuronenJeLayer);
    
        for (let i = 0; i < child.denseLayers.length; i++) {
            const childLayer = child.denseLayers[i];
            const parent1Layer = parent1.denseLayers[i];
            const parent2Layer = parent2.denseLayers[i];
    
            // Crossover für Biases
            for (let j = 0; j < childLayer.biases.length; j++) {
                childLayer.biases[j] = Math.random() < 0.5 ? parent1Layer.biases[j] : parent2Layer.biases[j];
            }
    
            // Crossover für Gewichte
            for (let j = 0; j < childLayer.weights.length; j++) {
                for (let k = 0; k < childLayer.weights[j].length; k++) {
                    childLayer.weights[j][k] = Math.random() < 0.5 ? parent1Layer.weights[j][k] : parent2Layer.weights[j][k];
                }
            }
        }
        return child;
    }

} // endOf Class



class DenseLayer {
    constructor(anzInputNeuronen, anzOutputNeuronen){
        this.inputs = new Array(anzInputNeuronen);
        this.outputs = new Array(anzOutputNeuronen);
        this.biases = new Array(anzOutputNeuronen);

        // Numbers Feature: Potenzial (Summe vor Aktivierungsfunktion) pro Output-Neuron
        this.potentials = new Array(anzOutputNeuronen);

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

        // Numbers Feature: falls Brain aus JSON kommt, gibt es potentials evtl. nicht -> nachrüsten
        if(!layer.potentials || layer.potentials.length !== layer.outputs.length){
            layer.potentials = new Array(layer.outputs.length).fill(0);
        }

        for(let i=0; i < layer.outputs.length; i++){
            let sum = 0;
            for(let j=0; j < layer.inputs.length; j++){
                sum += layer.inputs[j] * layer.weights[j][i];
            }

            // Numbers Feature: Potenzial speichern (Summe vor der Aktivierungsfunktion)
            layer.potentials[i] = sum;
            
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

    static drawNetwork(nnCTX, network, showNumbers=false){
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

            Visualizer.drawLayer(nnCTX, network.denseLayers[i], left, layerTop, width, layerHeight, showNumbers, i==0);
        }
    }

    static getRGBA(value, {
        baseAlpha = 0.1,   // <- Baseline-Helligkeit der Synapsen
        gamma = 0.6,        // <- <1 macht kleine Werte sichtbarer
        maxAbs = 1.0        // <- Normalisierung (bei dir passt meist 1.0 gut)
    } = {}) {
        // Sign getrennt von Stärke behandeln
        const sign = Math.sign(value) || 1;
        const mag = Math.min(Math.abs(value) / maxAbs, 1);      // 0..1
        const boosted = Math.pow(mag, gamma);                   // Gamma-Kurve
        const alpha = baseAlpha + (1 - baseAlpha) * boosted;    // Baseline + Anteil
        
        // Farbe: negativ rot, positiv weiß
        const R = 255;
        const G = sign > 0 ? 255 : 0;
        const B = sign > 0 ? 255 : 0;
        
        return `rgba(${R},${G},${B},${alpha})`;
    }

    static #getNeuronX(neurons, index, left, right){
        // X Position eines Neurons bei gleichemäßiger Verteilung mittels Linearer Interpolierung
        const t = neurons.length == 1 ? 0.5 : index/(neurons.length-1); // 0.5 falls nur ein Neuron, weil sonst 1
        return lerp(left, right, t);
    }

    // --- Numbers Feature ---
    // Zeichne Text entlang einer Verbindung (mit Strichrichtung/Rotation)
    static drawTextOnLine(ctx, x1, y1, x2, y2, text){
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const angle = Math.atan2(y2 - y1, x2 - x1);

        ctx.save();
        ctx.translate(mx, my);
        ctx.rotate(angle);

        // Text-Style
        ctx.font = "14px Calibri";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";

        // Outline für Lesbarkeit (auf hellen Stellen)
        ctx.lineWidth = 4;
        ctx.strokeStyle = "black";
        ctx.strokeText(text, 0, -4);

        ctx.fillStyle = "white";
        ctx.fillText(text, 0, -4);

        ctx.restore();
    }

    // Zeichne Text mit Outline (allgemein) (Centered)
    static drawOutlinedText(ctx, text, x, y, font="14px Calibri"){
        ctx.save();
        ctx.font = font;
        ctx.textAlign = "center";
        ctx.lineWidth = 4;
        ctx.strokeStyle = "black";
        ctx.fillStyle = "white";
        ctx.strokeText(text, x, y);
        ctx.fillText(text, x, y);
        ctx.restore();
    }

    // Zeichne Text mit Outline (übernimmt TextAlign/TextBaseline/Font von ctx)
    static drawOutlinedTextFree(ctx, text, x, y){
        ctx.save();
        ctx.lineWidth = 4;
        ctx.strokeStyle = "black";
        ctx.fillStyle = "white";
        ctx.strokeText(text, x, y);
        ctx.fillText(text, x, y);
        ctx.restore();
    }
    // --- end Numbers Feature ---
    

    static drawLayer(nnCTX, layer, left, top, width, height, showNumbers=false, isFirstLayer=false){
        const right = left + width;
        const bottom = top + height;
        const neuronRadius = 15; //mit einem margin von 40px mit 20px Abstand zum Rand
        const {inputs, outputs, weights, biases} = layer; // Attribute aus einem Array in einzelne Variablen mit der "Destrukturierungs Syntax"
        const potentials = layer.potentials || []; // Guard, damit nichts crasht

        // Connections (zuerst damit sie unterhalb der Kreise gezeichnet werden)
        for(let i=0; i < inputs.length; i++){
            for(let o=0; o < outputs.length; o++){
                const x1 = Visualizer.#getNeuronX(inputs, i, left, right);
                const y1 = bottom;
                const x2 = Visualizer.#getNeuronX(outputs, o, left, right);
                const y2 = top;

                nnCTX.beginPath();
                nnCTX.moveTo(x1, y1);
                nnCTX.lineTo(x2, y2);

                // Zeichnen der Wheights in ihrer Stärke
                let value = weights[i][o] * inputs[i]; // wenn Wheight=0, wollen wir es auch nicht sehen, wenn stark gereizt durch input, stärker zeichen
                // immer etwas Wert adden damit man immer etwas opacity hat
                value += value < 0 ? -0.05 : 0.05; // kann man immer drauf adden weil die Inputs maximal ~0.85 werden aufgrund des Korpus der Cars
                nnCTX.strokeStyle = Visualizer.getRGBA(value);
                nnCTX.lineWidth = 2;
                nnCTX.stroke();

                // Numbers Feature: Weight Wert auf der Verbindung anzeigen (mit Strichrichtung)
                if(showNumbers){
                    const w = weights[i][o];
                    Visualizer.drawTextOnLine(nnCTX, x1, y1, x2, y2, w.toFixed(8));
                }
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

            // Numbers Feature: Inputs anzeigen
            if(showNumbers){
                if(isFirstLayer){
                    // Sensor-Inputs wie gehabt unterhalb
                    nnCTX.save();
                    nnCTX.textAlign = "center";
                    nnCTX.textBaseline = "top";
                    nnCTX.font = "14px Calibri";
                    Visualizer.drawOutlinedTextFree(nnCTX, inputs[i].toFixed(2), x, bottom + neuronRadius + 6);
                    nnCTX.restore();
                }else{
                    // Hidden-Layer Inputs zentriert im Kreis (das ist der sichtbare "mittlere Layer")
                    nnCTX.save();
                    nnCTX.textAlign = "center";
                    nnCTX.textBaseline = "middle";
                    nnCTX.font = "16px Calibri";
                    Visualizer.drawOutlinedTextFree(nnCTX, inputs[i].toFixed(0), x, bottom);
                    nnCTX.restore();
                }
            }
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

            // Numbers Feature: Output im Zentrum, Bias unterhalb + Potenzial rechts vom Neuron
            if(showNumbers){
                // Output-Wert ZENTRIERT im Kreis
                nnCTX.save();
                nnCTX.textAlign = "center";
                nnCTX.textBaseline = "middle";
                nnCTX.font = "16px Calibri";
                Visualizer.drawOutlinedTextFree(
                    nnCTX,
                    outputs[o].toFixed(0),
                    x,
                    top
                );
                nnCTX.restore();
            
                // Bias/Schwellwert unterhalb des Kreises
                nnCTX.save();
                nnCTX.textAlign = "center";
                nnCTX.textBaseline = "top";
                nnCTX.font = "14px Calibri";
                Visualizer.drawOutlinedTextFree(
                    nnCTX,
                    "b=" + biases[o].toFixed(2),
                    x,
                    top + neuronRadius + 22
                );
                nnCTX.restore();

                // Potenzial (Summe vor Aktivierungsfunktion) rechts vom Neuron
                // bei allen layern die keine input layer sind, hätte ich gerne noch die das potenzial also die Summe die in die aktivierungsfunktiong gegebn wird mit 2 nachkommastellen immer rechts vom neuron eingeblendet..
                // Also neben der mittleren schicht und der letzten
                const pot = (potentials[o] !== undefined && potentials[o] !== null) ? potentials[o] : 0;

                nnCTX.save();
                nnCTX.textAlign = "left";
                nnCTX.textBaseline = "middle";
                nnCTX.font = "14px Calibri";
                Visualizer.drawOutlinedTextFree(
                    nnCTX,
                    pot.toFixed(2),
                    x + neuronRadius + 12,
                    top
                );
                nnCTX.restore();
            }
        }

    }//drawLayer


}//endOF class Visualizer
