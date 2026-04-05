const { body, validationResult } = require("express-validator");
const { sendResponse } = require("../../utils/response");
const uploadConfig = require("../../config/upload.config");

const validateProgressUpload = [
  body("childId")
    .isUUID()
    .withMessage("Invalid child ID format"),
  body("notes")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Notes must not exceed 500 characters"),
];

const validateFile = (req, res, next) => {
  if (!req.file) {
    return sendResponse(res, 400, "No file uploaded");
  }

  const allowedTypes = [
    ...uploadConfig.ALLOWED_PHOTO_TYPES,
    ...uploadConfig.ALLOWED_VIDEO_TYPES,
  ];

  if (!allowedTypes.includes(req.file.mimetype)) {
    return sendResponse(
      res,
      400,
      "Invalid file type. Allowed: JPEG, PNG, WEBP, MP4, MOV, AVI"
    );
  }

  const maxSize = uploadConfig.ALLOWED_PHOTO_TYPES.includes(req.file.mimetype)
    ? uploadConfig.getPhotoMaxSize()
    : uploadConfig.getVideoMaxSize();

  if (req.file.size > maxSize) {
    const maxMB = uploadConfig.ALLOWED_PHOTO_TYPES.includes(req.file.mimetype)
      ? uploadConfig.MAX_PHOTO_SIZE
      : uploadConfig.MAX_VIDEO_SIZE;
    return sendResponse(res, 400, `File size must not exceed ${maxMB}MB`);
  }

  next();
};

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendResponse(res, 400, "Validation failed", errors.array());
  }
  next();
};

module.exports = {
  validateProgressUpload,
  validateFile,
  validate,
};
