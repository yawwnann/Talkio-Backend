const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { validateRegister, validateLogin, validate } = require("../middlewares/validators/auth.validator");

router.post("/register", validateRegister, validate, authController.register);
router.post("/login", validateLogin, validate, authController.login);

module.exports = router;
