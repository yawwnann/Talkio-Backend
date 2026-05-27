const { body, param, validationResult } = require("express-validator");
const { sendResponse } = require("../../utils/response");

const validateCreateChild = [
  body("name")
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Name must be between 1 and 100 characters"),
  body("dateOfBirth")
    .isISO8601()
    .withMessage("Please provide a valid date of birth")
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      if (birthDate > today) {
        throw new Error("Date of birth cannot be in the future");
      }
      return true;
    }),
  body("gender")
    .isIn(["MALE", "FEMALE"])
    .withMessage("Gender must be MALE or FEMALE"),
];

const validateGetChild = [
  param("id")
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

const validateUpdateChild = [
  param("id")
    .isUUID()
    .withMessage("Invalid child ID format"),
  body("name")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Name must be between 1 and 100 characters"),
  body("dateOfBirth")
    .optional()
    .isISO8601()
    .withMessage("Please provide a valid date of birth")
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      if (birthDate > today) {
        throw new Error("Date of birth cannot be in the future");
      }
      return true;
    }),
  body("gender")
    .optional()
    .isIn(["MALE", "FEMALE"])
    .withMessage("Gender must be MALE or FEMALE"),
];

module.exports = {
  validateCreateChild,
  validateGetChild,
  validateUpdateChild,
  validate,
};
