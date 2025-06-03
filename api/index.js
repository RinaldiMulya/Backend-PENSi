
const express = require("express");
const cors = require("cors");
const path = require("path");
const { loadModel, predict } = require('../utils/modelService');

const app = express();
const PORT = process.env.PORT || 9000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // Serve static files (model files)

// Global variable to store loaded model
let mlModel = null;
let isModelLoaded = false;

// Load model on server startup
async function initializeModel() {
  try {
    console.log("Loading ML model...");
    mlModel = await loadModel();
    isModelLoaded = true;
    console.log("Model loaded successfully");
  } catch (error) {
    console.error("Failed to load model:", error);
    isModelLoaded = false;
  }
}

// Routes
app.get("/", (req, res) => {
  res.json({
    message: "Retirement Calculator API Server",
    status: "running",
    modelLoaded: isModelLoaded,
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    modelLoaded: isModelLoaded,
    timestamp: new Date().toISOString(),
  });
});

// Model status endpoint
app.get("/model/status", (req, res) => {
  res.json({
    loaded: isModelLoaded,
    ready: mlModel !== null,
  });
});

// Prediction endpoint
app.post("/predict", async (req, res) => {
  try {
    // Check if model is loaded
    if (!isModelLoaded || !mlModel) {
      return res.status(503).json({
        error: "Model not loaded",
        message: "ML model is not ready. Please try again later.",
      });
    }

    // Validate request body
    const { inputData } = req.body;

    if (!inputData || !Array.isArray(inputData)) {
      return res.status(400).json({
        error: "Invalid input",
        message: "inputData must be an array",
      });
    }

    // Validate input data length (should be 8 features)
    if (inputData.length !== 8) {
      return res.status(400).json({
        error: "Invalid input length",
        message: "inputData must contain exactly 8 values",
      });
    }

    // Validate that all inputs are numbers
    const validInputs = inputData.every(
      (val) => typeof val === "number" && !isNaN(val)
    );
    if (!validInputs) {
      return res.status(400).json({
        error: "Invalid input values",
        message: "All input values must be valid numbers",
      });
    }

    console.log("Predicting with input:", inputData);

    // Make prediction
    const prediction = await predict(mlModel, inputData);

    console.log("Prediction result:", prediction);

    res.json({
      success: true,
      prediction: prediction,
      inputData: inputData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Prediction error:", error);
    res.status(500).json({
      error: "Prediction failed",
      message: error.message || "An error occurred during prediction",
    });
  }
});

// Batch prediction endpoint (for multiple predictions)
// app.post("/predict/batch", async (req, res) => {
//   try {
//     if (!isModelLoaded || !mlModel) {
//       return res.status(503).json({
//         error: "Model not loaded",
//         message: "ML model is not ready. Please try again later.",
//       });
//     }

//     const { batchData } = req.body;

//     if (!batchData || !Array.isArray(batchData)) {
//       return res.status(400).json({
//         error: "Invalid input",
//         message: "batchData must be an array of input arrays",
//       });
//     }

//     const predictions = [];

//     for (let i = 0; i < batchData.length; i++) {
//       const inputData = batchData[i];

//       if (!Array.isArray(inputData) || inputData.length !== 8) {
//         return res.status(400).json({
//           error: "Invalid batch input",
//           message: `Item at index ${i} must be an array of 8 numbers`,
//         });
//       }

//       const prediction = await predict(mlModel, inputData);
//       predictions.push({
//         index: i,
//         input: inputData,
//         prediction: prediction,
//       });
//     }

//     res.json({
//       success: true,
//       predictions: predictions,
//       count: predictions.length,
//       timestamp: new Date().toISOString(),
//     });
//   } catch (error) {
//     console.error("Batch prediction error:", error);
//     res.status(500).json({
//       error: "Batch prediction failed",
//       message: error.message || "An error occurred during batch prediction",
//     });
//   }
// });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Internal server error",
    message: "Something went wrong!",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Not found",
    message: "The requested endpoint does not exist",
  });
});

// Start server
async function startServer() {
  await initializeModel();
  
  console.log(app._router.stack
  .filter(r => r.route)
  .map(r => r.route.path)
);


  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Model loaded: ${isModelLoaded}`);
    console.log("Available endpoints:");
    console.log(`  GET  http://localhost:${PORT}/`);
    console.log(`  GET  http://localhost:${PORT}/health`);
    console.log(`  GET  http://localhost:${PORT}/model/status`);
    console.log(`  POST http://localhost:${PORT}/predict`);
    console.log(`  POST http://localhost:${PORT}/predict/batch`);
  });
}

startServer().catch(console.error);

module.exports = app;
