const { body, query, param, validationResult } = require("express-validator");

// Validation result middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: "error",
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

// ============================================
// PUBLIC ENDPOINT VALIDATORS
// ============================================

const validateGetAllEducation = [
  query("type")
    .optional()
    .isIn(["ARTICLE", "VIDEO"])
    .withMessage("Type must be 'ARTICLE' or 'VIDEO'"),
  
  query("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean value"),
  
  query("search")
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Search query cannot be empty"),
  
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  
  validate,
];

const validateGetEducationById = [
  param("id")
    .isUUID()
    .withMessage("Invalid education content ID"),
  
  validate,
];

// ============================================
// ADMIN ENDPOINT VALIDATORS
// ============================================

const validateCreateEducation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 3, max: 200 })
    .withMessage("Title must be between 3 and 200 characters"),
  
  body("description")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must be less than 500 characters"),
  
  body("content")
    .trim()
    .notEmpty()
    .withMessage("Content is required"),
  
  body("type")
    .trim()
    .notEmpty()
    .withMessage("Type is required")
    .isIn(["ARTICLE", "VIDEO"])
    .withMessage("Type must be 'ARTICLE' or 'VIDEO'"),
  
  body("thumbnail")
    .optional()
    .isURL()
    .withMessage("Thumbnail must be a valid URL"),
  
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean value"),
  
  body("order")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Order must be a non-negative integer"),
  
  validate,
];

const validateUpdateEducation = [
  param("id")
    .isUUID()
    .withMessage("Invalid education content ID"),
  
  body("title")
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage("Title must be between 3 and 200 characters"),
  
  body("description")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must be less than 500 characters"),
  
  body("content")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Content cannot be empty"),
  
  body("type")
    .optional()
    .trim()
    .isIn(["ARTICLE", "VIDEO"])
    .withMessage("Type must be 'ARTICLE' or 'VIDEO'"),
  
  body("thumbnail")
    .optional()
    .isURL()
    .withMessage("Thumbnail must be a valid URL"),
  
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean value"),
  
  body("order")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Order must be a non-negative integer"),
  
  validate,
];

const validateDeleteEducation = [
  param("id")
    .isUUID()
    .withMessage("Invalid education content ID"),
  
  validate,
];

const validateToggleEducationStatus = [
  param("id")
    .isUUID()
    .withMessage("Invalid education content ID"),
  
  validate,
];

module.exports = {
  validate,
  validateGetAllEducation,
  validateGetEducationById,
  validateCreateEducation,
  validateUpdateEducation,
  validateDeleteEducation,
  validateToggleEducationStatus,
};
