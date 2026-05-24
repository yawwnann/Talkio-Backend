const prisma = require("../utils/prisma");
const { sendResponse } = require("../utils/response");

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50, // Limit to recent 50 notifications
    });

    return sendResponse(res, 200, "Notifications fetched successfully", notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    return sendResponse(res, 200, "Unread count fetched", { count });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify ownership
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return sendResponse(res, 404, "Notification not found");
    }

    if (notification.userId !== userId) {
      return sendResponse(res, 403, "Access denied");
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return sendResponse(res, 200, "Notification marked as read", updated);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return sendResponse(res, 200, "All notifications marked as read");
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
