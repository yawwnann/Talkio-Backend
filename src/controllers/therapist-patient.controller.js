const prisma = require("../utils/prisma");
const { sendResponse } = require("../utils/response");

// Get patient progress history
const getPatientProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const therapistId = req.user.id;

    // Verify therapist has access to this patient
    const session = await prisma.therapySession.findFirst({
      where: {
        childId: id,
        therapistId,
      },
    });

    if (!session) {
      return sendResponse(res, 403, "Not authorized to access this patient");
    }

    // Get progress notes
    const progressNotes = await prisma.progressNote.findMany({
      where: { childId: id },
      orderBy: { date: "desc" },
    });

    // Get progress uploads
    const progressUploads = await prisma.progressUpload.findMany({
      where: { childId: id },
      orderBy: { createdAt: "desc" },
    });

    const progressData = {
      childId: id,
      progressNotes,
      progressUploads,
    };

    return sendResponse(res, 200, "Patient progress fetched", progressData);
  } catch (error) {
    console.error("Get patient progress error:", error);
    return sendResponse(res, 500, "Failed to fetch patient progress");
  }
};

// Get patient exercise history
const getPatientExercises = async (req, res) => {
  try {
    const { id } = req.params;
    const therapistId = req.user.id;

    // Verify therapist has access to this patient
    const session = await prisma.therapySession.findFirst({
      where: {
        childId: id,
        therapistId,
      },
    });

    if (!session) {
      return sendResponse(res, 403, "Not authorized to access this patient");
    }

    // Get game logs (exercises)
    const gameLogs = await prisma.gameLog.findMany({
      where: { childId: id },
      orderBy: { playedAt: "desc" },
      take: 50,
    });

    return sendResponse(res, 200, "Patient exercises fetched", gameLogs);
  } catch (error) {
    console.error("Get patient exercises error:", error);
    return sendResponse(res, 500, "Failed to fetch patient exercises");
  }
};

module.exports = {
  getPatientProgress,
  getPatientExercises,
};
