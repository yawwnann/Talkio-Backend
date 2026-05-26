const cloudinary = require("../config/cloudinary.config");
const { sendResponse } = require("../utils/response");

const uploadFile = async (req, res) => {
  try {
    console.log("[Cloudinary] Request received");

    if (!req.file) {
      console.log("[Cloudinary] No file in request");
      return sendResponse(res, 400, "No file uploaded");
    }

    const { childId } = req.body;

    if (!childId) {
      console.log("[Cloudinary] No childId in request");
      return sendResponse(res, 400, "Child ID is required");
    }

    // Determine resource type based on mimetype
    let resourceType = "image";
    if (req.file.mimetype.startsWith("video/")) {
      resourceType = "video";
    } else if (req.file.mimetype.startsWith("audio/")) {
      resourceType = "video"; // Cloudinary uses "video" for audio too
    }

    console.log("[Cloudinary] Uploading to Cloudinary, resourceType:", resourceType, "size:", req.file.size);

    // Upload to Cloudinary using buffer (with longer timeout for large files)
    const result = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Cloudinary upload timeout (>120s)"));
      }, 120000); // 2 minutes timeout

      cloudinary.uploader
        .upload_stream(
          {
            folder: process.env.CLOUDINARY_FOLDER || "talkio_uploads",
            resource_type: resourceType,
            public_id: `${childId}_${Date.now()}`,
            timeout: 120000, // Cloudinary's own timeout
          },
          (error, result) => {
            clearTimeout(timeout);
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(req.file.buffer);
    });

    console.log("[Cloudinary] Upload successful:", result.secure_url);

    return sendResponse(res, 200, "File uploaded successfully", {
      secureUrl: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      bytes: result.bytes,
      duration: result.duration || null,
      format: result.format,
      width: result.width || null,
      height: result.height || null,
    });
  } catch (error) {
    console.error("[Cloudinary] Upload error:", error);
    return sendResponse(res, 500, "Failed to upload file: " + error.message);
  }
};

const deleteFile = async (req, res) => {
  try {
    const { publicId } = req.body;

    if (!publicId) {
      return sendResponse(res, 400, "Public ID is required");
    }

    await cloudinary.uploader.destroy(publicId);

    return sendResponse(res, 200, "File deleted successfully");
  } catch (error) {
    console.error("[Cloudinary] Delete error:", error);
    return sendResponse(res, 500, "Failed to delete file: " + error.message);
  }
};

module.exports = {
  uploadFile,
  deleteFile,
};
