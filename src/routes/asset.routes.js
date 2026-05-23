const express = require("express");
const router = express.Router();
const assetController = require("../controllers/asset.controller");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middlewares/auth.middleware");

router.get(
  "/",
  authenticateToken,
  authorizeRoles("ADMIN"),
  assetController.getAllAssets,
);

router.post(
  "/",
  authenticateToken,
  authorizeRoles("ADMIN"),
  assetController.createAsset,
);

router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("ADMIN"),
  assetController.updateAsset,
);

router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("ADMIN"),
  assetController.deleteAsset,
);

module.exports = router;
