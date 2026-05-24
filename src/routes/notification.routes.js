const express = require("express");
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} = require("../controllers/notification.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

const router = express.Router();

// Require authentication for all notification routes
router.use(authenticateToken);

router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.put("/read-all", markAllAsRead);
router.put("/:id/read", markAsRead);

// For testing purposes during development (Optional: remove in production)
if (process.env.NODE_ENV !== "production") {
  const { sendNotification } = require("../services/notification.service");
  router.post("/test-emit", async (req, res) => {
    try {
      const { title, body, type } = req.body;
      const notification = await sendNotification({
        userId: req.user.id,
        title: title || "Test Notification",
        body: body || "This is a test notification from WebSocket.",
        type: type || "INFO",
      });
      res.json({ success: true, notification });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

module.exports = router;
