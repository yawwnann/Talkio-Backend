const fs = require("fs");
const path = require("path");
const { sendResponse } = require("../utils/response");
const cloudinary = require("../config/cloudinary.config");

const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads", "progress");

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Upload file (gambar/video/audio) langsung ke Cloudinary
 * Tidak lagi menyimpan ke VPS storage lokal
 */
const uploadFile = async (req, res) => {
  try {
    console.log("[Cloudinary] Upload request received");

    if (!req.file) {
      console.log("[Cloudinary] No file in request");
      return sendResponse(res, 400, "No file uploaded");
    }

    const { childId } = req.body;

    if (!childId) {
      console.log("[Cloudinary] No childId in request");
      return sendResponse(res, 400, "Child ID is required");
    }

    const isVideo = req.file.mimetype.startsWith("video/");
    const isAudio = req.file.mimetype.startsWith("audio/");

    // Determine resource type untuk Cloudinary
    let resourceType = "image";
    if (isVideo) resourceType = "video";
    else if (isAudio) resourceType = "video"; // Cloudinary treat audio sebagai video resource

    // Tentukan format dan folder
    const ext = path.extname(req.file.originalname).toLowerCase().replace(".", "") || "mp4";
    const safeChildId = childId.replace(/[^a-zA-Z0-9]/g, "_");
    const publicId = `${safeChildId}_${Date.now()}`;

    let folder = "progress/images";
    if (isVideo) folder = "progress/videos";
    else if (isAudio) folder = "progress/audio";

    // Upload langsung ke Cloudinary dari buffer
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          resource_type: resourceType,
          folder: folder,
          format: ext,
          // Opsi untuk video: quality dan format otomatic
          ...(isVideo && {
            quality: "auto",
            fetch_format: "auto",
          }),
        },
        (error, result) => {
          if (error) {
            console.error("[Cloudinary] Upload error:", error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      uploadStream.end(req.file.buffer);
    });

    console.log("[Cloudinary] Upload success:", result.secure_url, `(${result.bytes} bytes)`);

    let fileType = "image";
    if (isVideo) fileType = "video";
    else if (isAudio) fileType = "audio";

    return sendResponse(res, 200, "File uploaded successfully", {
      secureUrl: result.secure_url,
      publicId: result.public_id,
      resourceType: fileType,
      bytes: result.bytes,
      duration: result.duration || null,
      format: result.format,
      width: result.width,
      height: result.height,
    });
  } catch (error) {
    console.error("[Cloudinary] Error:", error);
    return sendResponse(res, 500, "Failed to upload file: " + error.message);
  }
};

/**
 * Hapus file dari Cloudinary
 */
const deleteFile = async (req, res) => {
  try {
    const { publicId } = req.body;

    if (!publicId) {
      return sendResponse(res, 400, "Public ID is required");
    }

    // Tentukan resource type — perkiraan dari publicId folder
    let resourceType = "image";
    if (publicId.includes("/videos") || publicId.includes("/audio")) {
      resourceType = "video";
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    if (result.result === "ok") {
      console.log("[Cloudinary] Deleted:", publicId);
      return sendResponse(res, 200, "File deleted successfully");
    }

    return sendResponse(res, 404, "File not found");
  } catch (error) {
    console.error("[Cloudinary] Delete error:", error);
    return sendResponse(res, 500, "Failed to delete file");
  }
};

module.exports = {
  uploadFile,
  deleteFile,
};
