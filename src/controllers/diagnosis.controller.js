const prisma = require("../utils/prisma");
const { sendResponse } = require("../utils/response");
const { ageInMonths } = require("../utils/age");
const { ForwardChainingEngine } = require("../services/forwardChaining.service");
const { sendNotification } = require("../services/notification.service");
const { sendNotificationToAllAdmins } = require("../services/notification.service");

const createDiagnosis = async (req, res) => {
  try {
    const { childId, answers } = req.body;

    const child = await prisma.child.findUnique({ where: { id: childId } });

    if (!child) {
      return sendResponse(res, 404, "Child not found");
    }

    if (child.parentId !== req.user.id) {
      return sendResponse(res, 403, "Access denied.");
    }

    const childAgeInMonths = ageInMonths(child.dateOfBirth);
    const fcEngine = new ForwardChainingEngine();
    const fcResult = fcEngine.infer(answers, childAgeInMonths);

    const newDiagnosis = await prisma.diagnosis.create({
      data: {
        childId,
        answers: answers,
        ageInMonths: childAgeInMonths,
        ageCategory: fcResult.ageCategory,
        riskLevel: fcResult.riskLevel,
        confidence: fcResult.confidence,
        score: fcResult.score,
        derivedFacts: fcResult.derivedFacts,
        triggeredRules: fcResult.triggeredRules,
        findings: fcResult.categoryFindings,
        recommendations: fcResult.recommendations,
        summary: JSON.stringify(fcResult.summary),
        symptom: answers.vocabulary_count || null,
      },
    });

    const responseData = {
      id: newDiagnosis.id,
      childId: newDiagnosis.childId,
      answers: newDiagnosis.answers,
      ageInMonths: newDiagnosis.ageInMonths,
      ageCategory: newDiagnosis.ageCategory,
      riskLevel: newDiagnosis.riskLevel,
      confidence: newDiagnosis.confidence,
      score: newDiagnosis.score,
      derivedFacts: newDiagnosis.derivedFacts,
      triggeredRules: newDiagnosis.triggeredRules,
      findings: newDiagnosis.findings,
      recommendations: newDiagnosis.recommendations,
      summary: newDiagnosis.summary,
      nextStep: fcResult.riskLevel === "HIGH" ? "/api/therapy/booking" : "/api/diagnosis/history",
      createdAt: newDiagnosis.createdAt,
    };

    // Send notifications
    try {
      // Notify parent about the result
      await sendNotification({
        userId: child.parentId,
        title: fcResult.riskLevel === "HIGH" ? "Diagnosis Risiko Tinggi" : "Diagnosis Selesai",
        body: `Hasil diagnosis untuk ${child.name}: ${fcResult.riskLevel} (skor: ${fcResult.score}%)`,
        type: fcResult.riskLevel === "HIGH" ? "DIAGNOSIS_HIGH" : "DIAGNOSIS_COMPLETE",
        childId: childId,
      });

      // If HIGH risk, notify admin
      if (fcResult.riskLevel === "HIGH") {
        await sendNotificationToAllAdmins({
          title: "Diagnosis Risiko Tinggi",
          body: `${child.name} didiagnosis dengan risiko tinggi (skor: ${fcResult.score}%)`,
          type: "DIAGNOSIS_HIGH",
          childId: childId,
        });
      }
    } catch (notifError) {
      console.warn("[Diagnosis] Notification send failed:", notifError.message);
    }

    return sendResponse(res, 201, "Diagnosis created successfully", responseData);
  } catch (error) {
    console.error("Error creating diagnosis:", error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

const getDiagnosisHistory = async (req, res) => {
  try {
    const { childId } = req.params;
    const child = await prisma.child.findUnique({ where: { id: childId } });

    if (!child) {
      return sendResponse(res, 404, "Child not found");
    }

    if (child.parentId !== req.user.id && req.user.role !== "ADMIN" && req.user.role !== "THERAPIST") {
      return sendResponse(res, 403, "Access denied.");
    }

    const diagnoses = await prisma.diagnosis.findMany({
      where: { childId },
      orderBy: { createdAt: "desc" },
    });

    return sendResponse(res, 200, "History fetched", diagnoses);
  } catch (error) {
    console.error("Error fetching diagnosis history:", error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

const getDiagnosisById = async (req, res) => {
  try {
    const { id } = req.params;

    const diagnosis = await prisma.diagnosis.findUnique({
      where: { id },
      include: { child: true },
    });

    if (!diagnosis) {
      return sendResponse(res, 404, "Diagnosis not found");
    }

    if (diagnosis.child.parentId !== req.user.id && req.user.role !== "ADMIN" && req.user.role !== "THERAPIST") {
      return sendResponse(res, 403, "Access denied.");
    }

    return sendResponse(res, 200, "Diagnosis fetched", diagnosis);
  } catch (error) {
    console.error("Error fetching diagnosis:", error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

module.exports = { createDiagnosis, getDiagnosisHistory, getDiagnosisById };
