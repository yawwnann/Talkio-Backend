// Minimal ML service implementation.
// In tests, this module is mocked by tests/setup.js.

async function predictSpeechDelay(_payload) {
  return {
    success: false,
    message: "ML service not configured",
  };
}

async function analyzeVoice(_filePath) {
  return {
    success: false,
    message: "ML service not configured",
  };
}

async function healthCheck() {
  return {
    status: "unavailable",
    service: process.env.ML_SERVICE_URL || null,
  };
}

module.exports = {
  predictSpeechDelay,
  analyzeVoice,
  healthCheck,
};
