const prisma = require("../utils/prisma");
const { sendResponse } = require("../utils/response");
const { initializeMidtrans, THERAPY_PRICE } = require("../config/midtrans.config");
const { isWithinWorkingHoursWib } = require("../config/working-hours.config");
const {
  ROOMS_PER_SLOT,
  PENDING_RESERVATION_MINUTES,
} = require("../config/booking-capacity.config");

const createSession = async (req, res) => {
  try {
    const { childId, therapistId, schedule, therapyType } = req.body;
    const parentId = req.user.id;

    // Validate child exists and belongs to parent
    const child = await prisma.child.findUnique({
      where: { id: childId },
    });

    if (!child) {
      return sendResponse(res, 404, "Child not found");
    }
    
    if (child.parentId !== parentId) {
      return sendResponse(res, 403, "Access denied");
    }

    // Validate therapist if provided
    if (therapistId) {
      const therapist = await prisma.user.findUnique({
        where: { id: therapistId },
      });
      
      if (!therapist || therapist.role !== "THERAPIST") {
        return sendResponse(res, 400, "Invalid therapist selected");
      }
    }

    const scheduleDate = new Date(schedule);
    if (Number.isNaN(scheduleDate.getTime())) {
      return sendResponse(res, 400, "Invalid schedule date");
    }

    if (!isWithinWorkingHoursWib(scheduleDate)) {
      return sendResponse(res, 400, "Schedule must be within working hours (14:00-21:00 WIB)");
    }

    const oneHourLater = new Date(scheduleDate.getTime() + 60 * 60 * 1000);
    const reservationCutoff = new Date(Date.now() - PENDING_RESERVATION_MINUTES * 60 * 1000);

    // Room capacity check (2 rooms per time slot)
    const reservedCount = await prisma.therapySession.count({
      where: {
        schedule: { gte: scheduleDate, lt: oneHourLater },
        sessionStatus: { not: "CANCELLED" },
        OR: [
          { isActive: true },
          { paymentStatus: "SUCCESS" },
          { paymentStatus: "PENDING", createdAt: { gte: reservationCutoff } },
        ],
      },
    });

    if (reservedCount >= ROOMS_PER_SLOT) {
      return sendResponse(res, 409, "Time slot is full (2 rooms already booked)");
    }

    // Therapist cannot handle two sessions at the same time
    if (therapistId) {
      const therapistReservedCount = await prisma.therapySession.count({
        where: {
          therapistId,
          schedule: { gte: scheduleDate, lt: oneHourLater },
          sessionStatus: { not: "CANCELLED" },
          OR: [
            { isActive: true },
            { paymentStatus: "SUCCESS" },
            { paymentStatus: "PENDING", createdAt: { gte: reservationCutoff } },
          ],
        },
      });

      if (therapistReservedCount >= 1) {
        return sendResponse(res, 409, "Therapist is not available at this time");
      }
    }

    // Create session (PENDING)
    const session = await prisma.therapySession.create({
      data: {
        childId,
        therapistId,
        schedule: scheduleDate,
        therapyType,
        paymentStatus: "PENDING",
      },
    });

    // Generate Midtrans payment token
    let paymentUrl = null;
    let transactionToken = null;

    try {
      const snap = initializeMidtrans();
      
      const parameter = {
        transaction_details: {
          order_id: `THERAPY-${session.id}`,
          gross_amount: THERAPY_PRICE,
        },
        credit_card: {
          secure: true,
        },
        customer_details: {
          first_name: child.name,
          email: req.user.email,
          phone: "",
        },
        item_details: [{
          id: therapyType,
          price: THERAPY_PRICE,
          quantity: 1,
          name: `Therapy Session - ${therapyType}`,
        }],
        callbacks: {
          finish: `${process.env.FRONTEND_URL || "http://localhost:3000"}/payment/finish`,
        },
      };

      const transaction = await snap.createTransaction(parameter);
      
      paymentUrl = transaction.redirect_url;
      transactionToken = transaction.token;

      // Update session with payment info
      await prisma.therapySession.update({
        where: { id: session.id },
        data: {
          transactionId: `THERAPY-${session.id}`,
          paymentUrl: paymentUrl,
        },
      });

    } catch (midtransError) {
      console.error("Midtrans error:", midtransError);
      // Fallback to mock URL if Midtrans fails
      paymentUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/payment/mock/${session.id}`;
    }

    return sendResponse(
      res,
      201,
      "Therapy session booked. Proceed to payment.",
      {
        session: {
          ...session,
          transactionId: `THERAPY-${session.id}`,
          paymentUrl: paymentUrl,
        },
        paymentUrl,
        transactionToken,
        amount: THERAPY_PRICE,
      }
    );
  } catch (error) {
    console.error("Therapy booking error:", error);
    return sendResponse(res, 500, "Failed to book therapy session");
  }
};

const getHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    // Get sessions for all children of this user
    const sessions = await prisma.therapySession.findMany({
      where: {
        child: {
          parentId: userId,
        },
      },
      include: {
        child: true,
        therapist: {
          select: { name: true, email: true },
        },
      },
      orderBy: { schedule: "desc" },
    });

    return sendResponse(res, 200, "Therapy history fetched", sessions);
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

module.exports = {
  createSession,
  getHistory,
};
