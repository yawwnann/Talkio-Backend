const express = require("express");
const router = express.Router();
const parentController = require("../controllers/parent.controller");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middlewares/auth.middleware");

// Get all reports for parent's children
router.get(
  "/reports",
  authenticateToken,
  authorizeRoles("PARENT"),
  parentController.getReports,
);

// Get single report detail
router.get(
  "/reports/:id",
  authenticateToken,
  authorizeRoles("PARENT"),
  parentController.getReportDetail,
);

// Get therapy schedule for parent's children
router.get(
  "/schedule",
  authenticateToken,
  authorizeRoles("PARENT"),
  parentController.getSchedule,
);

// Get payment history for parent's children
router.get(
  "/payments",
  authenticateToken,
  authorizeRoles("PARENT"),
  parentController.getPayments,
);

// Book a therapy session
router.post(
  "/book",
  authenticateToken,
  authorizeRoles("PARENT"),
  parentController.bookSession,
);

module.exports = router;
