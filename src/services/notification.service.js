const prisma = require("../utils/prisma");
const { getIO } = require("../websocket");

/**
 * Creates a notification in the database and emits it via WebSocket.
 *
 * @param {Object} params
 * @param {String} params.userId - The ID of the user receiving the notification
 * @param {String} params.title - Notification title
 * @param {String} params.body - Notification body/message
 * @param {String} [params.type="INFO"] - Type of notification (e.g. INFO, THERAPY_UPDATE)
 * @param {String} [params.childId] - Child ID for navigation (used by PROGRESS_UPLOAD)
 */
const sendNotification = async ({ userId, title, body, type = "INFO", childId = null }) => {
  try {
    // 1. Save to Database
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        body,
        type,
        ...(childId && { childId }),
      },
    });

    // 2. Emit via WebSocket
    try {
      const io = getIO();
      // Emit to the user's specific room
      io.to(`user_${userId}`).emit("notification", notification);
      console.log(`[Notification Service] Emitted notification to user_${userId}`);
    } catch (wsError) {
      // If WebSocket is not initialized or fails, we just log it.
      // The notification is already saved in DB.
      console.warn("[Notification Service] WebSocket emit failed:", wsError.message);
    }

    return notification;
  } catch (error) {
    console.error("[Notification Service] Error creating notification:", error);
    throw error;
  }
};

module.exports = {
  sendNotification,
};
