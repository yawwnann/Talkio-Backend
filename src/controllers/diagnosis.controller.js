const prisma = require("../utils/prisma");
const { sendResponse } = require("../utils/response");

// Rule-Based Logic
const calculateRisk = (symptoms) => {
  // Simple logic: If more than 5 symptoms, High Risk. 3-5 Medium. < 3 Low.
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
    const { childId, symptoms } = req.body;

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

    // Use rule-based logic
    const fallback = calculateRisk(symptoms);
    const riskLevel = fallback.riskLevel;
    const score = fallback.score;
    const recommendation = fallback.recommendation;

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
    });
    return sendResponse(res, 200, "History fetched", diagnosis);
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

module.exports = {
  createDiagnosis,
  getDiagnosisHistory,
};
