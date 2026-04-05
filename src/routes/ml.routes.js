const express = require("express");
const router = express.Router();
const mlController = require("../controllers/ml.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");

// Predict speech delay from features
router.post(
  "/speech-delay",
  authenticateToken,
  mlController.predictSpeechDelay
);

// Analyze voice/audio file
router.post(
  "/voice-analysis",
  authenticateToken,
  upload.single("audio"),
  mlController.analyzeVoice
);

// Check ML service health
router.get("/health", mlController.checkMLHealth);

module.exports = router;
