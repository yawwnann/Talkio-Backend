const express = require("express");
const router = express.Router();
const therapistController = require("../controllers/therapist.controller");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middlewares/auth.middleware");

router.get(
  "/patients",
  authenticateToken,
  authorizeRoles("THERAPIST"),
  therapistController.getPatients,
);
router.get(
  "/patient/:id",
  authenticateToken,
  authorizeRoles("THERAPIST"),
  therapistController.getPatientDetail,
);
router.patch(
  "/evaluate",
  authenticateToken,
  authorizeRoles("THERAPIST"),
  therapistController.evaluatePatient,
);
router.get(
  "/report/:id",
  authenticateToken,
  authorizeRoles("THERAPIST"),
  therapistController.generateReport,
);
router.get(
  "/reports",
  authenticateToken,
  authorizeRoles("THERAPIST"),
  therapistController.getReportHistory,
);
router.post(
  "/report",
  authenticateToken,
  authorizeRoles("THERAPIST"),
  therapistController.createReport,
);
router.patch(
  "/report/:id",
  authenticateToken,
  authorizeRoles("THERAPIST"),
  therapistController.updateReport,
);

// Get therapist accessibility (accessible by parent)
router.get(
  "/availability",
  authenticateToken,
  authorizeRoles("PARENT", "THERAPIST"),
  therapistController.getAvailability,
);

// List all therapists (accessible by parent)
router.get(
  "/list",
  authenticateToken,
  authorizeRoles("PARENT"),
  therapistController.listTherapists,
);

module.exports = router;
