const { body, param, validationResult } = require("express-validator");
const { sendResponse } = require("../../utils/response");

const validateDiagnosisCheck = [
  body("childId")
    .isUUID()
    .withMessage("Invalid child ID format"),
  body("symptoms")
    .isArray({ min: 1 })
    .withMessage("Symptoms must be an array with at least one item")
    .custom((symptoms) => {
      // Validate each symptom is a valid format
      const validTypes = ["string", "number", "boolean", "object"];
      return symptoms.every((s) => validTypes.includes(typeof s));
    }),
];

const validateDiagnosisHistory = [
  param("childId")
    .isUUID()
    .withMessage("Invalid child ID format"),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendResponse(res, 400, "Validation failed", errors.array());
  }
  next();
};

module.exports = {
  validateDiagnosisCheck,
  validateDiagnosisHistory,
  validate,
};
