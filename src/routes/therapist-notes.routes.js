const express = require("express");
const router = express.Router();
const therapistNotesController = require("../controllers/therapist-notes.controller");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middlewares/auth.middleware");

// All routes require THERAPIST role
router.use(authenticateToken);
router.use(authorizeRoles("THERAPIST"));

router.post("/notes", therapistNotesController.createNote);
router.get("/notes/:childId", therapistNotesController.getNotesByChild);
router.patch("/notes/:id", therapistNotesController.updateNote);
router.delete("/notes/:id", therapistNotesController.deleteNote);

module.exports = router;
