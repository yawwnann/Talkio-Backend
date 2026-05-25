const express = require("express");
const router = express.Router();
const therapyController = require("../controllers/therapy.controller");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middlewares/auth.middleware");
const { validateTherapyBooking, validate } = require("../middlewares/validators/therapy.validator");

router.post(
  "/booking",
  authenticateToken,
  authorizeRoles("PARENT"),
  validateTherapyBooking,
  validate,
  therapyController.createSession,
);
router.get(
  "/history",
  authenticateToken,
  authorizeRoles("PARENT"),
  therapyController.getHistory,
);

// Get new payment URL for pending session
router.post(
  "/payment-url",
  authenticateToken,
  authorizeRoles("PARENT"),
  therapyController.getPaymentUrl,
);

module.exports = router;
