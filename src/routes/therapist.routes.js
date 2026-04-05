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

module.exports = router;
