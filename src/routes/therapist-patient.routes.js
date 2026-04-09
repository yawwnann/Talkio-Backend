const express = require("express");
const router = express.Router();
const therapistPatientController = require("../controllers/therapist-patient.controller");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middlewares/auth.middleware");

// All routes require THERAPIST role
router.use(authenticateToken);
router.use(authorizeRoles("THERAPIST"));

router.get("/patients/:id/progress", therapistPatientController.getPatientProgress);
router.get("/patients/:id/exercises", therapistPatientController.getPatientExercises);

module.exports = router;
