const express = require("express");
const router = express.Router();
const educationController = require("../controllers/education.controller");
const { authenticateToken, authorizeRoles } = require("../middlewares/auth.middleware");
const {
  validateGetAllEducation,
  validateGetEducationById,
  validateCreateEducation,
  validateUpdateEducation,
  validateDeleteEducation,
  validateToggleEducationStatus,
} = require("../middlewares/validators/education.validator");

// ============================================
// PUBLIC ENDPOINTS (No auth required)
// ============================================

// Get all education content
router.get(
  "/",
  validateGetAllEducation,
  educationController.getAllEducation
);

// Get education content by ID
router.get(
  "/:id",
  validateGetEducationById,
  educationController.getEducationById
);

// ============================================
// ADMIN ENDPOINTS (Auth required)
// ============================================

// Create education content
router.post(
  "/",
  authenticateToken,
  authorizeRoles("ADMIN"),
  validateCreateEducation,
  educationController.createEducation
);

// Update education content
router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("ADMIN"),
  validateUpdateEducation,
  educationController.updateEducation
);

// Delete education content
router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("ADMIN"),
  validateDeleteEducation,
  educationController.deleteEducation
);

// Toggle education content status
router.patch(
  "/:id/toggle-status",
  authenticateToken,
  authorizeRoles("ADMIN"),
  validateToggleEducationStatus,
  educationController.toggleEducationStatus
);

module.exports = router;
