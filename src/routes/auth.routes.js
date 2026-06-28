const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { validateRegister, validateLogin, validateForgotPassword, validateResetPassword, validate } = require("../middlewares/validators/auth.validator");
const { authenticateToken } = require("../middlewares/auth.middleware");

router.post("/register", validateRegister, validate, authController.register);
router.post("/login", validateLogin, validate, authController.login);
router.post("/forgot-password", validateForgotPassword, validate, authController.forgotPassword);
router.post("/reset-password", validateResetPassword, validate, authController.resetPassword);
router.put("/recovery-pin", authenticateToken, authController.setRecoveryPin);
router.post("/logout", authenticateToken, authController.logout);
router.put("/change-password", authenticateToken, authController.changePassword);

module.exports = router;
