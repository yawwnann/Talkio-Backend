const { body, param, validationResult } = require("express-validator");
const { sendResponse } = require("../../utils/response");

const validateDiagnosisCheck = [
  body("childId")
    .isUUID()
    .withMessage("Invalid child ID format"),
  body("answers")
    .isObject()
    .withMessage("Answers must be an object")
    .custom((answers) => {
      // Validate each answer is a string
      const values = Object.values(answers);
      if (values.length === 0) {
        throw new Error("Answers cannot be empty");
      }
      return values.every(v => typeof v === "string");
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
