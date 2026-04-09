const express = require("express");
const router = express.Router();
const therapistScheduleController = require("../controllers/therapist-schedule.controller");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middlewares/auth.middleware");

// All routes require THERAPIST role
router.use(authenticateToken);
router.use(authorizeRoles("THERAPIST"));

router.get("/schedule", therapistScheduleController.getSchedule);
router.post("/schedule", therapistScheduleController.createSchedule);
router.patch("/schedule/:id", therapistScheduleController.updateSchedule);
router.delete("/schedule/:id", therapistScheduleController.deleteSchedule);

module.exports = router;
