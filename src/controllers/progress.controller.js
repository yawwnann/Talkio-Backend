const prisma = require("../utils/prisma");
const cloudinary = require("../config/cloudinary.config");
const { sendResponse } = require("../utils/response");
const { sendNotification } = require("../services/notification.service");
const streamifier = require("streamifier");
const path = require("path");

const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB

const uploadProgress = async (req, res) => {
  try {
    const { childId, notes } = req.body;
    const file = req.file;

    if (!file) return sendResponse(res, 400, "No file uploaded");

    // Validate video size
    if (file.mimetype.startsWith("video/") && file.size > MAX_VIDEO_SIZE) {
      return sendResponse(res, 400, "Ukuran video maksimal 50MB");
    }

    // Verify child belongs to parent
    const child = await prisma.child.findUnique({ where: { id: childId } });
    if (!child) return sendResponse(res, 404, "Child not found");
    if (child.parentId !== req.user.id)
      return sendResponse(res, 403, "Access denied");

    // Determine resource type for Cloudinary
    let resourceType = "image";
    if (file.mimetype.startsWith("video/")) resourceType = "video";
    else if (file.mimetype.startsWith("audio/")) resourceType = "video"; // audio uses video resource type for streaming

    const folder = process.env.CLOUDINARY_FOLDER || "progress_uploads";

    // Upload to Cloudinary
    const cloudinaryResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          public_id: `${childId}_${Date.now()}`,
          ...(file.mimetype.startsWith("video/") && { max_bytes: MAX_VIDEO_SIZE }),
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });

    // Save to database
    const progress = await prisma.progressUpload.create({
      data: {
        childId,
        fileUrl: cloudinaryResult.secure_url,
        cloudinaryPublicId: cloudinaryResult.public_id,
        parentNotes: notes || null,
        fileType: file.mimetype.startsWith("video/")
          ? "video"
          : file.mimetype.startsWith("audio/")
            ? "audio"
            : "image",
      },
    });

    // Send notification to therapists who have active sessions with this child
    try {
      const activeSessions = await prisma.therapySession.findMany({
        where: { childId, therapistId: { not: null } },
        select: { therapistId: true },
        distinct: ["therapistId"],
      });

      for (const session of activeSessions) {
        if (session.therapistId) {
          await sendNotification({
            userId: session.therapistId,
            title: "Progress Baru",
            body: `${child.name} mengunggah progress baru`,
            type: "PROGRESS_UPLOAD",
          });
        }
      }
    } catch (notifError) {
      console.warn("[Progress] Notification send failed:", notifError.message);
    }

    return sendResponse(res, 201, "Progress uploaded successfully", progress);
  } catch (error) {
    console.error("[Progress] Upload error:", error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

const getProgressHistory = async (req, res) => {
  try {
    const { childId } = req.params;

    const child = await prisma.child.findUnique({ where: { id: childId } });
    if (!child) return sendResponse(res, 404, "Child not found");
    if (child.parentId !== req.user.id)
      return sendResponse(res, 403, "Access denied");

    const history = await prisma.progressUpload.findMany({
      where: { childId },
      orderBy: { createdAt: "desc" },
    });

    return sendResponse(res, 200, "Progress history fetched", history);
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

module.exports = {
  uploadProgress,
  getProgressHistory,
};
