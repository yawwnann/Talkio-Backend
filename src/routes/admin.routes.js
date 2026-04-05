const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middlewares/auth.middleware");

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
router.put(
  "/users/:id",
  authenticateToken,
  authorizeRoles("ADMIN"),
  adminController.manageUser,
);
router.post(
  "/education",
  authenticateToken,
  authorizeRoles("ADMIN"),
  adminController.addEducationContent,
);

module.exports = router;
