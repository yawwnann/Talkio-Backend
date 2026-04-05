const express = require("express");
const router = express.Router();
const childController = require("../controllers/child.controller");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middlewares/auth.middleware");
const { validateCreateChild, validateGetChild, validate } = require("../middlewares/validators/child.validator");

router.post(
  "/",
  authenticateToken,
  authorizeRoles("PARENT"),
  validateCreateChild,
  validate,
  childController.createChild,
);
router.get(
  "/",
  authenticateToken,
  authorizeRoles("PARENT"),
  childController.getChildren,
);
router.get("/:id", authenticateToken, validateGetChild, validate, childController.getChildById);

module.exports = router;
