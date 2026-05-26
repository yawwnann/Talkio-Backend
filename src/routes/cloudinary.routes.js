const express = require("express");
const router = express.Router();
const cloudinaryController = require("../controllers/cloudinary.controller");
const { authenticateToken, authorizeRoles } = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");

// Upload file to Cloudinary
// POST /api/cloudinary/upload
router.post(
  "/upload",
  authenticateToken,
  authorizeRoles("PARENT", "THERAPIST"),
  upload.single("file"),
  cloudinaryController.uploadFile
);

// Delete file from Cloudinary
// DELETE /api/cloudinary/delete
router.delete(
  "/delete",
  authenticateToken,
  cloudinaryController.deleteFile
);

module.exports = router;
