const cloudinary = require("../config/cloudinary.config");
const { sendResponse } = require("../utils/response");
const streamifier = require("streamifier");

const uploadFile = async (req, res) => {
  try {
    console.log("[Cloudinary] Request received");
    console.log("[Cloudinary] File:", req.file);
    console.log("[Cloudinary] Body:", req.body);

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

    console.log("[Cloudinary] Uploading to Cloudinary, resourceType:", resourceType);

    // Upload to Cloudinary using buffer
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: process.env.CLOUDINARY_FOLDER || "talkio_uploads",
          resource_type: resourceType,
          public_id: `${childId}_${Date.now()}`,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
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
