const express = require("express");
const router = express.Router();
const gameController = require("../controllers/game.controller");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middlewares/auth.middleware");

router.post(
  "/log",
  authenticateToken,
  authorizeRoles("PARENT"),
  gameController.logGameResult,
);
router.get(
  "/history/:childId",
  authenticateToken,
  gameController.getGameHistory,
);

module.exports = router;
