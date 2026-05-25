const express = require("express");
const router = express.Router();
const diagnosisController = require("../controllers/diagnosis.controller");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middlewares/auth.middleware");
const { validateDiagnosisCheck, validateDiagnosisHistory, validate } = require("../middlewares/validators/diagnosis.validator");

router.post(
  "/check",
  authenticateToken,
  authorizeRoles("PARENT"),
  validateDiagnosisCheck,
  validate,
  diagnosisController.createDiagnosis,
);
router.get(
  "/history/:childId",
  authenticateToken,
  validateDiagnosisHistory,
  validate,
  diagnosisController.getDiagnosisHistory,
);
router.get(
  "/:id",
  authenticateToken,
  diagnosisController.getDiagnosisById,
);

module.exports = router;
