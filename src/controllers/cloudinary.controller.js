const fs = require("fs");
const path = require("path");
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

    // Generate unique filename
    const ext = path.extname(req.file.originalname);
    const filename = `${childId}_${Date.now()}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // Save file to local storage
    fs.writeFileSync(filepath, req.file.buffer);
    const fileSize = req.file.size;

    console.log("[Upload] File saved:", filepath, "size:", fileSize);

    // Determine file type
    let fileType = "image";
    if (req.file.mimetype.startsWith("video/")) {
      fileType = "video";
    } else if (req.file.mimetype.startsWith("audio/")) {
      fileType = "audio";
    }

    // Generate URL for the file
    const baseUrl = process.env.BASE_URL || `http://${process.env.HOST || 'localhost'}:${process.env.PORT || 4000}`;
    const fileUrl = `${baseUrl}/uploads/progress/${filename}`;

    return sendResponse(res, 200, "File uploaded successfully", {
      secureUrl: fileUrl,
      publicId: filename,
      resourceType: fileType,
      bytes: fileSize,
      duration: null,
      format: ext.replace(".", ""),
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
