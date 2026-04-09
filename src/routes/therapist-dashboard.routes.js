const express = require("express");
const router = express.Router();
const therapistDashboardController = require("../controllers/therapist-dashboard.controller");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middlewares/auth.middleware");

// All routes require THERAPIST role
router.use(authenticateToken);
router.use(authorizeRoles("THERAPIST"));

router.get("/dashboard/stats", therapistDashboardController.getDashboardStats);

module.exports = router;
