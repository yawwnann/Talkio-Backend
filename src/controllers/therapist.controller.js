const prisma = require("../utils/prisma");
const { sendResponse } = require("../utils/response");
const { generatePatientReport } = require("../utils/pdf-generator");
const fs = require("fs");

// Get patients scheduled with this therapist
const getPatients = async (req, res) => {
  try {
    const therapistId = req.user.id;
    const patients = await prisma.therapySession.findMany({
      where: { therapistId, isActive: true },
      distinct: ["childId"],
      include: {
        child: {
          include: { parent: { select: { name: true, email: true } } },
        },
      },
    });

    const uniquePatients = patients.map((p) => p.child);
    return sendResponse(res, 200, "Patients fetched", uniquePatients);
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

const getPatientDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const child = await prisma.child.findUnique({
      where: { id },
      include: {
        diagnoses: true,
        therapySessions: true,
        gameLogs: true,
        progressUploads: true,
      },
    });

    if (!child) return sendResponse(res, 404, "Child not found");
    return sendResponse(res, 200, "Patient detail fetched", child);
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

const evaluatePatient = async (req, res) => {
  try {
    const { progressId, evaluation } = req.body;

    const progress = await prisma.progressUpload.update({
      where: { id: progressId },
      data: { therapistEvaluation: evaluation },
    });

    return sendResponse(res, 200, "Evaluation submitted", progress);
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

const generateReport = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify child exists
    const child = await prisma.child.findUnique({
      where: { id },
    });

    if (!child) {
      return sendResponse(res, 404, "Child not found");
    }

    // Generate PDF
    const pdfPath = await generatePatientReport(id);

    // Check if file exists
    if (!fs.existsSync(pdfPath)) {
      return sendResponse(res, 500, "Failed to generate report");
    }

    // Send file as download
    res.download(pdfPath, `report-${child.name}-${Date.now()}.pdf`, (err) => {
      if (err) {
        console.error("Download error:", err);
        return sendResponse(res, 500, "Failed to download report");
      }
    });
  } catch (error) {
    console.error("Report generation error:", error);
    return sendResponse(res, 500, "Failed to generate report");
  }
};

module.exports = {
  getPatients,
  getPatientDetail,
  evaluatePatient,
  generateReport,
};
