module.exports = {
  SERVICE_URL: process.env.ML_SERVICE_URL || "http://localhost:5000",
  API_TIMEOUT: parseInt(process.env.ML_API_TIMEOUT) || 10000,
  MODEL_VERSION: process.env.ML_MODEL_VERSION || "v1.0.0",
  RETRY_COUNT: 3,
  ENDPOINTS: {
    SPEECH_DELAY: "/api/v1/predict/speech-delay",
    VOICE_ANALYSIS: "/api/v1/predict/voice-analysis",
  },
};
