const express = require("express");
const router = express.Router();
const progressController = require("../controllers/progress.controller");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middlewares/auth.middleware");
const { validateProgressUpload, validate } = require("../middlewares/validators/progress.validator");

router.post(
  "/upload",
  authenticateToken,
  authorizeRoles("PARENT"),
  validateProgressUpload,
  validate,
  progressController.uploadProgress,
);

router.get(
  "/:childId",
  authenticateToken,
  authorizeRoles("PARENT"),
  progressController.getProgressHistory,
);

module.exports = router;
