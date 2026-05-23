const express = require("express");
const router = express.Router();

// Import therapist-related routes
const therapistRoutes = require("./therapist.routes");
const therapistNotesRoutes = require("./therapist-notes.routes");
const therapistScheduleRoutes = require("./therapist-schedule.routes");
const therapistDashboardRoutes = require("./therapist-dashboard.routes");
const therapistPatientRoutes = require("./therapist-patient.routes");

// Use all therapist-related routes under the /therapist prefix
router.use("/", therapistRoutes);
router.use("/", therapistNotesRoutes);
router.use("/", therapistScheduleRoutes);
router.use("/", therapistDashboardRoutes);
router.use("/", therapistPatientRoutes);

module.exports = router;