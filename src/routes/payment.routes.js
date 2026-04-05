const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");

// Midtrans webhook - no auth required (verified by signature)
router.post("/webhook", paymentController.paymentWebhook);

// Manual payment status check (for debugging)
router.get("/status/:sessionId", paymentController.checkPaymentStatus);

module.exports = router;
