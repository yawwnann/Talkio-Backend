const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");

router.get(
  "/dashboard",
  authenticateToken,
  authorizeRoles("ADMIN"),
  adminController.getDashboardStats,
);
router.get(
  "/users",
  authenticateToken,
  authorizeRoles("ADMIN"),
  adminController.getAllUsers,
);
router.post(
  "/users",
  authenticateToken,
  authorizeRoles("ADMIN"),
  adminController.createUser,
);
router.put(
  "/users/:id",
  authenticateToken,
  authorizeRoles("ADMIN"),
  adminController.manageUser,
);
router.get(
  "/assets",
  authenticateToken,
  authorizeRoles("ADMIN"),
  adminController.getAllAssets,
);
router.delete(
  "/assets/:filename",
  authenticateToken,
  authorizeRoles("ADMIN"),
  adminController.deleteAsset,
);
router.post(
  "/assets/upload",
  authenticateToken,
  authorizeRoles("ADMIN"),
  upload.single("file"),
  adminController.uploadAsset,
);
router.get(
  "/payments",
  authenticateToken,
  authorizeRoles("ADMIN"),
  adminController.getAdminPayments,
);
router.get(
  "/reports",
  authenticateToken,
  authorizeRoles("ADMIN"),
  adminController.getAdminReports,
);

module.exports = router;
