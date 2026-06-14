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

// Download PDF report for a child
router.get(
  "/report/pdf/:childId",
  authenticateToken,
  authorizeRoles("PARENT"),
  parentController.downloadPdfReport,
);



module.exports = router;
