const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { sendResponse } = require("../utils/response");

const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads", "progress");

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const uploadFile = async (req, res) => {
  try {
    console.log("[Upload] Request received");

    if (!req.file) {
      console.log("[Upload] No file in request");
      return sendResponse(res, 400, "No file uploaded");
    }

    const { childId } = req.body;

    if (!childId) {
      console.log("[Upload] No childId in request");
      return sendResponse(res, 400, "Child ID is required");
    }

    const isVideo = req.file.mimetype.startsWith("video/");
    const isAudio = req.file.mimetype.startsWith("audio/");

    // Generate unique filename
    const ext = path.extname(req.file.originalname);
    const filename = `${childId}_${Date.now()}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // Save file to local storage
    fs.writeFileSync(filepath, req.file.buffer);
    const originalSize = req.file.size;

    console.log("[Upload] File saved:", filepath, "size:", originalSize);

    let finalUrl = null;
    let finalFilename = filename;
    let finalSize = originalSize;

    // Convert video if needed (to H.264 MP4 for better compatibility)
    if (isVideo) {
      try {
        console.log("[Upload] Converting video...");

        const convertedFilename = `${childId}_${Date.now()}_converted.mp4`;
        const convertedFilepath = path.join(UPLOAD_DIR, convertedFilename);

        // Convert to H.264 MP4 with AAC audio (most compatible)
        // -crf 23: quality (lower = better quality, 18-28 is good range)
        // -preset medium: encoding speed vs compression tradeoff
        // -movflags +faststart: enables streaming playback while downloading
        execSync(`ffmpeg -i "${filepath}" -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k -movflags +faststart -y 2>&1`, { encoding: "utf-8" });

        // Get converted file size
        const convertedStats = fs.statSync(convertedFilepath);
        finalSize = convertedStats.size;
        finalUrl = `${process.env.BASE_URL || `http://${process.env.HOST || 'localhost'}:${process.env.PORT || 4000}`}/uploads/progress/${convertedFilename}`;
        finalFilename = convertedFilename;

        // Remove original file to save space
        fs.unlinkSync(filepath);

        console.log("[Upload] Video converted:", originalSize, "->", finalSize, "bytes");

      } catch (convertError) {
        console.error("[Upload] Convert error:", convertError.message);
        // Continue with original file if conversion fails
        finalUrl = `${process.env.BASE_URL || `http://${process.env.HOST || 'localhost'}:${process.env.PORT || 4000}`}/uploads/progress/${filename}`;
      }
    } else {
      finalUrl = `${process.env.BASE_URL || `http://${process.env.HOST || 'localhost'}:${process.env.PORT || 4000}`}/uploads/progress/${filename}`;
    }

    // Determine file type
    let fileType = "image";
    if (isVideo) fileType = "video";
    else if (isAudio) fileType = "audio";

    console.log("[Upload] Success:", finalUrl);

    return sendResponse(res, 200, "File uploaded successfully", {
      secureUrl: finalUrl,
      publicId: finalFilename,
      resourceType: fileType,
      bytes: finalSize,
      duration: null,
      format: path.extname(finalFilename).replace(".", ""),
    });
  } catch (error) {
    console.error("[Upload] Error:", error);
    return sendResponse(res, 500, "Failed to upload file: " + error.message);
  }
};

const deleteFile = async (req, res) => {
  try {
    const { publicId } = req.body;

    if (!publicId) {
      return sendResponse(res, 400, "Public ID is required");
    }

    const filepath = path.join(UPLOAD_DIR, publicId);

    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      return sendResponse(res, 200, "File deleted successfully");
    }

    return sendResponse(res, 404, "File not found");
  } catch (error) {
    console.error("[Upload] Delete error:", error);
    return sendResponse(res, 500, "Failed to delete file");
  }
};

module.exports = {
  uploadFile,
  deleteFile,
};
