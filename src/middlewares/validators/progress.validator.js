const { body, validationResult } = require("express-validator");
const { sendResponse } = require("../../utils/response");

const validateProgressUpload = [
  body("childId")
    .isUUID()
    .withMessage("Invalid child ID format"),
  body("fileUrl")
    .notEmpty()
    .withMessage("File URL is required"),
  body("fileType")
    .optional()
    .isIn(["image", "video", "audio"])
    .withMessage("File type must be image, video, or audio"),
  body("duration")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Duration must be a positive integer"),
  body("cloudinaryPublicId")
    .optional()
    .isString()
    .trim(),
  body("notes")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Notes must not exceed 500 characters"),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendResponse(res, 400, "Validation failed", errors.array());
  }
  next();
};

module.exports = {
  validateProgressUpload,
  validate,
};
