const prisma = require("../utils/prisma");
const { sendResponse } = require("../utils/response");
const { sendNotification } = require("../services/notification.service");

const uploadProgress = async (req, res) => {
  try {
    const { childId, fileUrl, cloudinaryPublicId, fileType, duration, notes } = req.body;

    // Verify child belongs to parent
    const child = await prisma.child.findUnique({ where: { id: childId } });
    if (!child) return sendResponse(res, 404, "Child not found");
    if (child.parentId !== req.user.id)
      return sendResponse(res, 403, "Access denied");

    // Save to database
    const progress = await prisma.progressUpload.create({
      data: {
        childId,
        fileUrl,
        cloudinaryPublicId: cloudinaryPublicId || null,
        parentNotes: notes || null,
        fileType: fileType || "image",
        duration: duration ? parseInt(duration) : null,
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
