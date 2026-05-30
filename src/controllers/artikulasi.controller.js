const prisma = require("../utils/prisma");
const { sendResponse } = require("../utils/response");
const {
  evaluateArtikulasiProgress,
  getParentProgress,
  getTherapistProgress,
} = require("../services/artikulasi-fc.service");
const {
  uploadFromBufferLocal,
} = require("../services/audio-upload.service");

/**
 * Helper: Cek apakah user boleh akses data anak
 */
async function canAccessChild(childId, userId, userRole) {
  if (userRole === "ADMIN") return true;

  if (userRole === "THERAPIST") {
    const session = await prisma.therapySession.findFirst({
      where: { childId, therapistId: userId },
    });
    return !!session;
  }

  if (userRole === "PARENT") {
    const child = await prisma.child.findUnique({ where: { id: childId } });
    return child?.parentId === userId;
  }

  return false;
}

/**
 * POST /api/artikulasi/log
 * Simpan sesi latihan artikulasi (dengan audio recording)
 */
const logArticulationSession = async (req, res) => {
  try {
    const { childId, targetWord, targetSound, parentRating, parentNotes, sessionScore, roundNumber } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Validasi field wajib
    if (!childId || !targetWord || !targetSound) {
      return sendResponse(res, 400, "childId, targetWord, dan targetSound wajib diisi");
    }

    // Validasi targetSound
    const validSounds = ["R", "S", "L", "N"];
    if (!validSounds.includes(targetSound.toUpperCase())) {
      return sendResponse(res, 400, "targetSound harus R, S, L, atau N");
    }

    // Cek akses
    const canAccess = await canAccessChild(childId, userId, userRole);
    if (!canAccess) {
      return sendResponse(res, 403, "Akses ditolak");
    }

    // Cek anak ada
    const child = await prisma.child.findUnique({ where: { id: childId } });
    if (!child) {
      return sendResponse(res, 404, "Data anak tidak ditemukan");
    }

    // Upload audio ke storage lokal
    let audioUrl = null;
    if (req.file) {
      try {
        const uploadResult = await uploadFromBufferLocal(
          req.file.buffer,
          req.file.originalname,
          childId
        );
        audioUrl = uploadResult.secure_url;
        console.log(`[Artikulasi] Audio uploaded: ${audioUrl}`);
      } catch (uploadError) {
        console.error("[Artikulasi] Audio upload error:", uploadError);
        // Lanjut tanpa audio — tidak critical
      }
    }

    // Simpan sesi ke database
    const session = await prisma.articulationSession.create({
      data: {
        childId,
        targetWord: targetWord.toUpperCase(),
        targetSound: targetSound.toUpperCase(),
        parentRating: parentRating === "true" || parentRating === true,
        parentNotes: parentNotes || null,
        sessionScore: parseInt(sessionScore) || 15,
        roundNumber: parseInt(roundNumber) || 1,
        audioUrl,
      },
    });

    // Jalankan forward chaining evaluation
    const evaluation = await evaluateArtikulasiProgress(childId);

    // Ambil hints untuk bunyi yang baru dilatih
    const currentSound = targetSound.toUpperCase();
    const currentHints = evaluation.hints
      .filter((h) => h.sound === currentSound)
      .map((h) => h.message);

    const nextRecommendation = evaluation.recommendation || "Lanjutkan latihan!";

    return res.status(201).json({
      status: "success",
      message: "Sesi artikulasi disimpan",
      data: {
        session,
        hints: currentHints,
        nextRecommendation,
        soundStats: evaluation.stats[currentSound],
      },
    });
  } catch (error) {
    console.error("logArticulationSession error:", error);
    return sendResponse(res, 500, "Terjadi kesalahan server");
  }
};

/**
 * GET /api/artikulasi/:childId
 * Ambil semua sesi artikulasi untuk satu anak
 */
const getArticulationSessions = async (req, res) => {
  try {
    const { childId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Cek akses
    const canAccess = await canAccessChild(childId, userId, userRole);
    if (!canAccess) {
      return sendResponse(res, 403, "Akses ditolak");
    }

    // Ambil sesi
    const sessions = await prisma.articulationSession.findMany({
      where: { childId },
      orderBy: { createdAt: "desc" },
    });

    // Ambil progress summary
    const progress = await getParentProgress(childId);

    return res.status(200).json({
      status: "success",
      message: "Data artikulasi berhasil diambil",
      data: {
        sessions: sessions.slice(0, 20),
        soundStats: progress.stats,
        nextRecommendation: progress.nextRecommendation,
        nextSound: progress.nextSound,
      },
    });
  } catch (error) {
    console.error("getArticulationSessions error:", error);
    return sendResponse(res, 500, "Terjadi kesalahan server");
  }
};

/**
 * GET /api/artikulasi/:childId/summary
 * Ringkasan detail untuk dashboard terapis
 */
const getArticulationSummary = async (req, res) => {
  try {
    const { childId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Hanya terapis dan admin
    if (!["THERAPIST", "ADMIN"].includes(userRole)) {
      return sendResponse(res, 403, "Akses ditolak");
    }

    // Ambil data lengkap
    const data = await getTherapistProgress(childId);

    return res.status(200).json({
      status: "success",
      message: "Ringkasan artikulasi berhasil diambil",
      data: {
        soundStats: data.stats,
        summary: data.summary,
        timeline: data.timeline,
        latestSessions: data.latestSessions,
        trends: data.trends,
        chartData: data.chartData,
        evaluation: {
          hints: data.evaluation.hints,
          recommendation: data.evaluation.recommendation,
        },
      },
    });
  } catch (error) {
    console.error("getArticulationSummary error:", error);
    return sendResponse(res, 500, "Terjadi kesalahan server");
  }
};

module.exports = {
  logArticulationSession,
  getArticulationSessions,
  getArticulationSummary,
};
