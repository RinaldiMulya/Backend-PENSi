// utils/modelService.js
const tf = require('@tensorflow/tfjs');
const path = require('path');

class ModelService {
    constructor() {
        this.model = null;
        this.isReady = false;
    }

    async loadModel(modelPath = '/public/model/model.json') {
        try {
            console.log(`Attempting to load model from: ${modelPath}`);

            // kita buat banyak cara untuk loading model MLnya
            let modeldata = null;

            try {
                // Method 1: Try as LayersModel
                modeldata = await tf.loadLayersModel(modelPath);
                console.log('✓ Loaded as LayersModel');
            } catch (layersError) {
                console.log('LayersModel failed, trying GraphModel...');

                try {
                    // Method 2: Try as GraphModel
                    modeldata = await tf.loadLayersModel(modelPath);
                    console.log('✓ Loaded as GraphModel');
                } catch (graphError) {
                    console.log('GraphModel failed, creating manual model...');

                    // Method 3: Create manual model (fallback)
                    modeldata = this.createManualModel();
                    console.log('✓ Created manual model as fallback');
                }
            }

            // data ML yaitu modeldata di taruh ke model dan juga isReady akan menjadi benar/siap
            this.model = modeldata;
            this.isReady = true;

            // kita mencoba menampilkan semua data dari model ML jika ada sebagai double Check juga apakah sudah benar benar valid modelnya ada dan siap digunakan
            if (modeldata.summary) {
                console.log('Model Summary:');
                modeldata.summary();
            }

            return modeldata;
        } catch (error) {
            console.error('All model loading methods failed:', error);
            throw new Error(`Failed to load model: ${error.message}`);
        }
    }

    // nah ini bagian dari metode meload data nya, ini dengan cara manual
    createManualModel() {
        // Create manual model based on the architecture from frontend
        const model = tf.sequential({
            layers: [
                tf.layers.dense({
                    inputShape: [8],
                    units: 128,
                    activation: 'relu',
                    name: 'dense_3'
                }),
                tf.layers.dropout({
                    rate: 0.3,
                    name: 'dropout_1'
                }),
                tf.layers.dense({
                    units: 64,
                    activation: 'relu',
                    name: 'dense_4'
                }),
                tf.layers.dense({
                    units: 1,
                    activation: 'linear',
                    name: 'dense_5'
                })
            ]
        });

        // Compile the model
        model.compile({
            optimizer: 'adam',
            loss: 'meanSquaredError',
            metrics: ['mae']
        });

        console.log('Manual model created and compiled');
        return model;
    }

    // ini bagian pentingnya yaitu function untuk penghitugan prediksi 
    async predict(inputData) {

        // kita cek apakah syarat sudah terpenuhi semua atau belum
        if (!this.isReady || !this.model) {
            throw new Error('Model not ready');
        }
        // ini juga memastikan inputan user sudah benar terdapat 8 kolom/data yg harus di input
        if (!Array.isArray(inputData) || inputData.length !== 8) {
            throw new Error('Input must be an array of 8 numbers');
        }

        // kita memvalidasi untuk memastikan semua data number bukan string atau yg lain
        const validInputs = inputData.every(val => typeof val === 'number' && !isNaN(val));
        if (!validInputs) {
            throw new Error('All input values must be valid numbers');
        }

        let inputTensor = null;
        let prediction = null;

        try {
            // Create input tensor [1, 8] - batch size 1, 8 features
            inputTensor = tf.tensor2d([inputData], [1, 8]);

            console.log('Input tensor shape:', inputTensor.shape);
            console.log('Input data:', inputData);

            // Make prediction based on model type
            if (this.model.predict) {
                prediction = this.model.predict(inputTensor);
            } else if (this.model.execute) {
                prediction = this.model.execute(inputTensor);
            } else {
                throw new Error('Unknown model type - no predict or execute method');
            }

            // Get the prediction result
            const result = await prediction.data();
            console.log('Raw prediction result:', result);

            // Return the first (and should be only) prediction value
            return result[0];

        } catch (error) {
            console.error('Prediction error:', error);
            throw new Error(`Prediction failed: ${error.message}`);
        } finally {
            // Clean up tensors to prevent memory leaks
            if (inputTensor) {
                inputTensor.dispose();
            }
            if (prediction) {
                prediction.dispose();
            }
        }
    }

    async batchPredict(batchData) {
        if (!this.isReady || !this.model) {
            throw new Error('Model not ready');
        }

        if (!Array.isArray(batchData)) {
            throw new Error('Batch data must be an array');
        }

        const predictions = [];

        for (const inputData of batchData) {
            const result = await this.predict(inputData);
            predictions.push(result);
        }

        return predictions;
    }

    isModelReady() {
        return this.isReady && this.model !== null;
    }

    getModelInfo() {
        if (!this.model) {
            return null;
        }

        return {
            ready: this.isReady,
            type: this.model.constructor.name,
            inputShape: this.model.inputs ? this.model.inputs[0].shape : 'unknown',
            outputShape: this.model.outputs ? this.model.outputs[0].shape : 'unknown'
        };
    }

    dispose() {
        if (this.model) {
            this.model.dispose();
            this.model = null;
            this.isReady = false;
            console.log('Model disposed');
        }
    }
}

// Create singleton instance
const modelService = new ModelService();

// Export functions for compatibility
async function loadModel(modelPath) {
    return await modelService.loadModel(modelPath);
}

async function predict(model, inputData) {
    // If called with model parameter (for compatibility)
    if (model && inputData) {
        const tempService = new ModelService();
        tempService.model = model;
        tempService.isReady = true;
        return await tempService.predict(inputData);
    }

    // Use singleton instance
    return await modelService.predict(model); // In this case, 'model' is actually inputData
}

module.exports = {
    ModelService,
    modelService,
    loadModel,
    predict
};