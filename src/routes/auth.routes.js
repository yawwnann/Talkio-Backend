const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { validateRegister, validateLogin, validate } = require("../middlewares/validators/auth.validator");
const { authenticateToken } = require("../middlewares/auth.middleware");

router.post("/register", validateRegister, validate, authController.register);
router.post("/login", validateLogin, validate, authController.login);
router.post("/logout", authenticateToken, authController.logout);

module.exports = router;
