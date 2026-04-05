const prisma = require("../utils/prisma");
const { sendResponse } = require("../utils/response");
const mlService = require("../services/ml.service");

// Mock ML Prediction or Rule-Based Logic (fallback)
const calculateRisk = (symptoms) => {
  // Simple logic: If more than 5 symptoms, High Risk. 3-5 Medium. < 3 Low.
  // This should be replaced by actual ML Model call or more complex logic.
  let score = 0;
  if (Array.isArray(symptoms)) {
    score = symptoms.length * 10; // Arbitrary scoring
  }

  // Normalize score to 0-1 for risk level
  // Let's say max score is 100
  let normalizedScore = score / 100;
  if (normalizedScore > 1) normalizedScore = 1;

  let riskLevel = "LOW";
  let recommendation = "Keep monitoring.";

  if (normalizedScore > 0.7) {
    riskLevel = "HIGH";
    recommendation = "Consult a therapist immediately.";
  } else if (normalizedScore >= 0.3) {
    riskLevel = "MEDIUM";
    recommendation = "Observation recommended.";
  }

  return { riskLevel, score, recommendation };
};

const createDiagnosis = async (req, res) => {
  try {
    const { childId, symptoms, useML = true } = req.body;

    // Validate child belongs to parent
    const child = await prisma.child.findUnique({
      where: { id: childId },
    });

    if (!child) {
      return sendResponse(res, 404, "Child not found");
    }

    if (child.parentId !== req.user.id) {
      return sendResponse(res, 403, "Access denied.");
    }

    let riskLevel, score, recommendation;

    // Try ML prediction if enabled
    if (useML) {
      // Convert symptoms to features array (numerical)
      const features = convertSymptomsToFeatures(symptoms);
      
      const mlResult = await mlService.predictSpeechDelay(
        childId,
        features,
        { symptoms, child_age_months: calculateAgeInMonths(child.dateOfBirth) }
      );

      if (mlResult.success && !mlResult.fallback) {
        // Use ML result
        riskLevel = mlResult.riskLevel;
        score = mlResult.score;
        recommendation = mlResult.recommendation;
      } else {
        // Fallback to rule-based if ML fails
        const fallback = calculateRisk(symptoms);
        riskLevel = fallback.riskLevel;
        score = fallback.score;
        recommendation = fallback.recommendation;
      }
    } else {
      // Use rule-based logic
      const fallback = calculateRisk(symptoms);
      riskLevel = fallback.riskLevel;
      score = fallback.score;
      recommendation = fallback.recommendation;
    }

    const newDiagnosis = await prisma.diagnosis.create({
      data: {
        childId,
        symptoms: symptoms, // Store as JSON
        riskLevel,
        score,
        recommendation,
      },
    });

    return sendResponse(
      res,
      201,
      "Diagnosis created successfully",
      {
        ...newDiagnosis,
        risk_level: riskLevel,
        score: score,
        recommendation: recommendation,
        next_step: riskLevel === "HIGH" ? "/api/therapy/booking" : "/api/diagnosis/history",
      }
    );
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

const getDiagnosisHistory = async (req, res) => {
  try {
    const { childId } = req.params;
    const diagnosis = await prisma.diagnosis.findMany({
      where: { childId },
      orderBy: { createdAt: "desc" },
      include: {
        mlPrediction: true,
      },
    });
    return sendResponse(res, 200, "History fetched", diagnosis);
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

/**
 * Helper: Convert symptoms to numerical features
 * This should match what your ML model expects
 */
function convertSymptomsToFeatures(symptoms) {
  // Example mapping - adjust based on your ML model's requirements
  const features = [];
  
  if (Array.isArray(symptoms)) {
    symptoms.forEach((symptom) => {
      if (typeof symptom === "boolean") {
        features.push(symptom ? 1 : 0);
      } else if (typeof symptom === "number") {
        features.push(symptom);
      } else if (typeof symptom === "string") {
        // Try to parse numeric strings
        const num = parseFloat(symptom);
        features.push(isNaN(num) ? 0 : num);
      } else if (typeof symptom === "object") {
        // For complex symptoms objects, extract values
        Object.values(symptom).forEach((val) => {
          if (typeof val === "boolean") {
            features.push(val ? 1 : 0);
          } else if (typeof val === "number") {
            features.push(val);
          } else {
            features.push(0);
          }
        });
      }
    });
  }
  
  return features;
}

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
  createDiagnosis,
  getDiagnosisHistory,
};
