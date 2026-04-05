const express = require("express");
const router = express.Router();
const progressController = require("../controllers/progress.controller");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");
const { validateProgressUpload, validateFile, validate } = require("../middlewares/validators/progress.validator");

router.post(
  "/upload",
  authenticateToken,
  authorizeRoles("PARENT"),
  validateProgressUpload,
  validate,
  upload.single("file"),
  validateFile,
  progressController.uploadProgress,
);

module.exports = router;
