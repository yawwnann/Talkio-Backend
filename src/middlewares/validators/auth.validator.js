const { body, validationResult } = require("express-validator");
const { sendResponse } = require("../../utils/response");

const validateRegister = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .matches(/\d/)
    .withMessage("Password must contain at least one number"),
  body("name").optional().isString().trim().escape(),
  body("role")
    .optional()
    .isIn(["PARENT", "THERAPIST", "ADMIN"])
    .withMessage("Role must be PARENT, THERAPIST, or ADMIN"),
];

const validateLogin = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendResponse(res, 400, "Validation failed", errors.array());
  }
  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validate,
};
