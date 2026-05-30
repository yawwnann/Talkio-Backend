const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middlewares/auth.middleware");
const {
  logArticulationSession,
  getArticulationSessions,
  getArticulationSummary,
  reviewArticulationSession,
} = require("../controllers/artikulasi.controller");

// Configure multer for audio uploads (memory storage for Cloudinary)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "audio/mp4",
      "audio/mpeg",
      "audio/wav",
      "audio/aac",
      "audio/m4a",
      "audio/x-m4a",
      "audio/ogg",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Format audio tidak didukung. Gunakan MP3, WAV, M4A, atau AAC."));
    }
  },
});

/**
 * POST /api/artikulasi/log
 * Save a new articulation practice session
 *
 * Requires: parentId (from JWT), childId, targetWord, targetSound
 * Optional: parentRating, parentNotes, sessionScore, audio file
 */
router.post(
  "/log",
  authenticateToken,
  authorizeRoles("PARENT"),
  upload.single("audio"),
  logArticulationSession
);

/**
 * GET /api/artikulasi/:childId
 * Get articulation sessions and progress for a child
 * Accessible by: PARENT (own child), THERAPIST, ADMIN
 */
router.get(
  "/:childId",
  authenticateToken,
  authorizeRoles("PARENT", "THERAPIST", "ADMIN"),
  getArticulationSessions
);

/**
 * GET /api/artikulasi/:childId/summary
 * Get detailed articulation summary for therapist dashboard
 * Accessible by: THERAPIST, ADMIN only
 */
router.get(
  "/:childId/summary",
  authenticateToken,
  authorizeRoles("THERAPIST", "ADMIN"),
  getArticulationSummary
);

/**
 * POST /api/artikulasi/:sessionId/review
 * Therapist mereview & menilai satu sesi artikulasi
 * Accessible by: THERAPIST, ADMIN only
 *
 * Body: {
 *   therapistRating: "OKE" | "BELUM_OK",
 *   therapistScore: 0-100,
 *   therapistNotes: string (optional),
 *   suggestedWords: string[] (optional) - latihan tambahan
 * }
 */
router.post(
  "/:sessionId/review",
  authenticateToken,
  authorizeRoles("THERAPIST", "ADMIN"),
  reviewArticulationSession
);

module.exports = router;
