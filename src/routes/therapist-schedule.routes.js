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
router.put("/schedule/:id/complete", therapistScheduleController.completeSchedule);
router.patch("/schedule/:id", therapistScheduleController.updateSchedule);
router.delete("/schedule/:id", therapistScheduleController.deleteSchedule);

module.exports = router;
