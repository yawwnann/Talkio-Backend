const prisma = require("../utils/prisma");
const crypto = require("crypto");
const { sendNotification } = require("../services/notification.service");
const { sendNotificationToAllAdmins } = require("../services/notification.service");

const paymentWebhook = async (req, res) => {
  try {
    const notification = req.body;
    
    console.log("Payment webhook received:", JSON.stringify(notification, null, 2));

    // Verify notification signature (optional but recommended)
    const signatureKey = notification.signature_key;
    const orderId = notification.order_id;
    const statusCode = notification.status_code;
    const grossAmount = notification.gross_amount;
    const serverKey = process.env.MIDTRANS_SERVER_KEY;

    // Create signature for verification
    const expectedSignature = crypto
      .createHash("sha512")
      .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
      .digest("hex");

    // Verify signature (skip in development if needed)
    if (process.env.NODE_ENV === "production" && signatureKey !== expectedSignature) {
      console.error("Invalid signature:", signatureKey);
      return res.status(400).json({ error: "Invalid signature" });
    }

    // Extract session ID from order_id
    // New format: THP-{shortId}-{timestamp}
    // We need to find the session by transactionId
    let sessionId = null;

    // Try to find session by transaction ID (exact match)
    const session = await prisma.therapySession.findFirst({
      where: { transactionId: orderId },
    });

    if (session) {
      sessionId = session.id;
    } else {
      // Fallback: try old format extraction
      const parts = orderId.split('-');
      if (parts.length >= 2) {
        // Old format: THERAPY-{uuid}
        const potentialId = parts.slice(1).join('-');
        const existingSession = await prisma.therapySession.findUnique({
          where: { id: potentialId },
        });
        if (existingSession) {
          sessionId = potentialId;
        }
      }
    }

    if (!sessionId) {
      console.error("Session not found for order_id:", orderId);
      return res.status(404).json({ error: "Session not found" });
    }

    // Update payment status based on transaction status
    let paymentStatus = "PENDING";
    let isActive = false;

    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;

    switch (transactionStatus) {
      case "capture":
        if (fraudStatus === "accept") {
          paymentStatus = "SUCCESS";
          isActive = true;
        }
        break;
      case "settlement":
        paymentStatus = "SUCCESS";
        isActive = true;
        break;
      case "pending":
        paymentStatus = "PENDING";
        isActive = false;
        break;
      case "deny":
      case "cancel":
      case "expire":
        paymentStatus = "FAILED";
        isActive = false;
        break;
      case "refund":
        paymentStatus = "FAILED";
        isActive = false;
        break;
      default:
        console.log("Unknown transaction status:", transactionStatus);
    }

    // Update the therapy session
    const updatedSession = await prisma.therapySession.update({
      where: { id: sessionId },
      data: {
        paymentStatus,
        isActive,
      },
      include: {
        child: { select: { id: true, name: true, parentId: true } },
        therapist: { select: { id: true, name: true } },
      },
    });

    console.log(
      `Payment updated for session ${sessionId}: ${paymentStatus} (active: ${isActive})`
    );

    // Send notifications based on payment status
    try {
      if (paymentStatus === "SUCCESS") {
        // Notify parent
        if (updatedSession.child?.parentId) {
          await sendNotification({
            userId: updatedSession.child.parentId,
            title: "Pembayaran Berhasil",
            body: `Pembayaran untuk sesi terapi ${updatedSession.child.name} berhasil`,
            type: "PAYMENT_SUCCESS",
          });
        }
        // Notify admin
        await sendNotificationToAllAdmins({
          title: "Pembayaran Berhasil",
          body: `Pembayaran untuk ${updatedSession.child?.name || 'anak'} berhasil (Order: ${orderId})`,
          type: "PAYMENT_SUCCESS",
        });
      } else if (paymentStatus === "FAILED") {
        // Notify parent
        if (updatedSession.child?.parentId) {
          await sendNotification({
            userId: updatedSession.child.parentId,
            title: "Pembayaran Gagal",
            body: `Pembayaran untuk sesi terapi ${updatedSession.child?.name || 'anak'} gagal`,
            type: "PAYMENT_FAILED",
          });
        }
        // Notify admin
        await sendNotificationToAllAdmins({
          title: "Pembayaran Gagal",
          body: `Pembayaran untuk ${updatedSession.child?.name || 'anak'} gagal (Order: ${orderId})`,
          type: "PAYMENT_FAILED",
        });
      }
    } catch (notifError) {
      console.error("Failed to send payment notification:", notifError);
    }

    // Return success response to Midtrans
    return res.status(200).json({
      status: "success",
      message: "Notification received",
      session_id: sessionId,
      payment_status: paymentStatus,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to process webhook",
    });
  }
};

// Manual payment status check (for debugging/admin)
const checkPaymentStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await prisma.therapySession.findUnique({
      where: { id: sessionId },
      include: {
        child: {
          select: { name: true, parent: { select: { email: true } } },
        },
        therapist: {
          select: { name: true, email: true },
        },
      },
    });

    if (!session) {
      return res.status(404).json({
        status: "error",
        message: "Session not found",
      });
    }

    return res.status(200).json({
      status: "success",
      data: session,
    });
  } catch (error) {
    console.error("Check payment status error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to check payment status",
    });
  }
};

module.exports = {
  paymentWebhook,
  checkPaymentStatus,
};
