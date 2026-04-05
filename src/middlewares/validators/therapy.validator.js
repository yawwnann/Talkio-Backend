const { body, validationResult } = require("express-validator");
const { sendResponse } = require("../../utils/response");

const validateTherapyBooking = [
  body("childId")
    .isUUID()
    .withMessage("Invalid child ID format"),
  body("schedule")
    .isISO8601()
    .withMessage("Please provide a valid schedule date")
    .custom((value) => {
      const scheduleDate = new Date(value);
      const now = new Date();
      if (scheduleDate <= now) {
        throw new Error("Schedule must be in the future");
      }
      return true;
    }),
  body("therapyType")
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Therapy type must be between 1 and 50 characters"),
  body("therapistId")
    .optional()
    .isUUID()
    .withMessage("Invalid therapist ID format"),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendResponse(res, 400, "Validation failed", errors.array());
  }
  next();
};

module.exports = {
  validateTherapyBooking,
  validate,
};
