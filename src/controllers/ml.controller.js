const mlService = require("../services/ml.service");
const prisma = require("../utils/prisma");
const { sendResponse } = require("../utils/response");

/**
 * Predict speech delay risk from symptoms/features
 * POST /api/v1/predict/speech-delay
 */
const predictSpeechDelay = async (req, res) => {
  try {
    const { child_id, features } = req.body;

    // Validate child exists
    const child = await prisma.child.findUnique({
      where: { id: child_id },
    });

    if (!child) {
      return sendResponse(res, 404, "Child not found");
    }

    // Verify user has access to this child
    if (
      child.parentId !== req.user.id &&
      req.user.role !== "THERAPIST" &&
      req.user.role !== "ADMIN"
    ) {
      return sendResponse(res, 403, "Access denied");
    }

    // Call ML service
    const symptomsData = {
      features,
      child_age_months: calculateAgeInMonths(child.dateOfBirth),
      gender: child.gender,
    };

    const result = await mlService.predictSpeechDelay(
      child_id,
      features,
      symptomsData
    );

    if (result.fallback) {
      return sendResponse(res, 503, "ML service unavailable", {
        fallback: true,
        message: "Please try again later or use manual assessment",
      });
    }

    return sendResponse(res, 200, "Prediction completed", {
      child_id,
      risk_level: result.riskLevel,
      score: result.score,
      confidence: result.confidence,
      recommendation: result.recommendation,
      model_version: result.modelVersion,
      next_step:
        result.riskLevel === "HIGH"
          ? "/api/therapy/booking"
          : "/api/diagnosis/history",
    });
  } catch (error) {
    console.error("Speech delay prediction error:", error);
    return sendResponse(res, 500, "Failed to process prediction request");
  }
};

/**
 * Analyze voice/audio file for speech patterns
 * POST /api/v1/predict/voice-analysis
 */
const analyzeVoice = async (req, res) => {
  try {
    const file = req.file;
    const { child_id } = req.body;

    if (!file) {
      return sendResponse(res, 400, "No audio file provided");
    }

    if (!child_id) {
      return sendResponse(res, 400, "Child ID is required");
    }

    // Validate child exists
    const child = await prisma.child.findUnique({
      where: { id: child_id },
    });

    if (!child) {
      return sendResponse(res, 404, "Child not found");
    }

    // Verify user has access
    if (
      child.parentId !== req.user.id &&
      req.user.role !== "THERAPIST" &&
      req.user.role !== "ADMIN"
    ) {
      return sendResponse(res, 403, "Access denied");
    }

    // Validate audio file
    const allowedAudioTypes = [
      "audio/mpeg",
      "audio/mp4",
      "audio/aac",
      "audio/wav",
      "audio/x-m4a",
    ];

    if (!allowedAudioTypes.includes(file.mimetype)) {
      return sendResponse(
        res,
        400,
        "Invalid audio file. Allowed formats: MP3, AAC, WAV, M4A"
      );
    }

    // Call ML service for voice analysis
    const result = await mlService.analyzeVoice(file.path, child_id);

    if (result.fallback) {
      return sendResponse(res, 503, "ML service unavailable", {
        fallback: true,
        message: "Please try again later",
      });
    }

    return sendResponse(res, 200, "Voice analysis completed", {
      child_id,
      analysis: result.analysis,
      recommendations: result.recommendations,
      model_version: result.modelVersion,
    });
  } catch (error) {
    console.error("Voice analysis error:", error);
    return sendResponse(res, 500, "Failed to analyze voice");
  }
};

/**
 * Check ML service health
 * GET /api/v1/predict/health
 */
const checkMLHealth = async (req, res) => {
  try {
    const health = await mlService.healthCheck();
    return sendResponse(res, 200, "ML service health check", health);
  } catch (error) {
    return sendResponse(res, 500, "Failed to check ML service health");
  }
};

/**
 * Helper: Calculate age in months
 */
function calculateAgeInMonths(dateOfBirth) {
  const birth = new Date(dateOfBirth);
  const today = new Date();
  const months =
    (today.getFullYear() - birth.getFullYear()) * 12 +
    (today.getMonth() - birth.getMonth());
  return Math.max(0, months);
}

module.exports = {
  predictSpeechDelay,
  analyzeVoice,
  checkMLHealth,
};
