const express = require("express");
const router = express.Router();
const prisma = require("../utils/prisma");
const { sendResponse } = require("../utils/response");
const audioService = require("../services/audio.service");
const upload = require("../middlewares/upload.middleware");
const { authenticateToken } = require("../middlewares/auth.middleware");

/**
 * Upload audio file for voice analysis
 * POST /api/v1/audio/upload
 */
const uploadAudio = async (req, res) => {
  try {
    const file = req.file;
    const { child_id } = req.body;

    if (!file) {
      return sendResponse(res, 400, "No audio file uploaded");
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
    const validation = await audioService.validateAudioFile(file.path);
    if (!validation.valid) {
      return sendResponse(res, 400, validation.error);
    }

    // Hapus pemanggilan ke mlService.analyzeVoice

    // Menyimpan rekam medis/log audio (tanpa ML)
    // Di sini kita bisa simpan ke database jika perlu, atau sekadar membalas sukses
    
    return sendResponse(res, 200, "Audio file uploaded successfully (ML analysis disabled)", {
      child_id,
      file_info: {
        name: file.originalname,
        size: validation.metadata.fileSizeMB + "MB",
        type: validation.metadata.mimeType,
      },
      analysis: null,
      recommendations: [],
      ml_service_available: false,
    });
  } catch (error) {
    console.error("Audio upload error:", error);
    return sendResponse(res, 500, "Failed to process audio upload");
  }
};

/**
 * Upload audio without immediate analysis (for storage only)
 * POST /api/v1/audio/store
 */
const storeAudio = async (req, res) => {
  try {
    const file = req.file;
    const { child_id, notes } = req.body;

    if (!file) {
      return sendResponse(res, 400, "No audio file uploaded");
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
    const validation = await audioService.validateAudioFile(file.path);
    if (!validation.valid) {
      return sendResponse(res, 400, validation.error);
    }

    // Store as progress upload with audio type
    const progressUpload = await prisma.progressUpload.create({
      data: {
        childId: child_id,
        fileUrl: `/uploads/${file.filename}`,
        parentNotes: notes || `Audio recording: ${file.originalname}`,
      },
    });

    return sendResponse(res, 201, "Audio stored successfully", {
      upload_id: progressUpload.id,
      file_info: {
        name: file.originalname,
        size: validation.metadata.fileSizeMB + "MB",
        type: validation.metadata.mimeType,
        url: progressUpload.fileUrl,
      },
    });
  } catch (error) {
    console.error("Audio store error:", error);
    return sendResponse(res, 500, "Failed to store audio file");
  }
};

// Routes
router.post(
  "/upload",
  authenticateToken,
  upload.single("audio"),
  uploadAudio
);

router.post(
  "/store",
  authenticateToken,
  upload.single("audio"),
  storeAudio
);

module.exports = router;
