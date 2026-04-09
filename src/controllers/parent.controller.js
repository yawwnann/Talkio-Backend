const prisma = require("../utils/prisma");
const { sendResponse } = require("../utils/response");
const midtransClient = require("midtrans-client");

// Get all reports for parent's children
const getReports = async (req, res) => {
  try {
    const parentId = req.user.id;
    const { childId } = req.query;

    // Build where clause
    const where = {
      child: {
        parentId,
      },
    };

    // Filter by specific child if provided
    if (childId) {
      where.childId = childId;
    }

    // Get progress notes (reports) for parent's children
    const reports = await prisma.progressNote.findMany({
      where,
      include: {
        child: {
          select: {
            id: true,
            name: true,
            dateOfBirth: true,
            gender: true,
          },
        },
        therapist: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    // Transform to response format
    const reportList = reports.map((note) => ({
      id: note.id,
      childId: note.childId,
      childName: note.child.name,
      childDob: note.child.dateOfBirth,
      childGender: note.child.gender,
      therapistId: note.therapistId,
      therapistName: note.therapist.name,
      therapistEmail: note.therapist.email,
      title: note.title,
      content: note.content,
      status: note.status,
      date: note.date.toISOString().split("T")[0],
      createdAt: note.createdAt.toISOString(),
    }));

    return sendResponse(res, 200, "Reports fetched successfully", reportList);
  } catch (error) {
    console.error("Get reports error:", error);
    return sendResponse(res, 500, "Failed to fetch reports");
  }
};

// Get single report detail
const getReportDetail = async (req, res) => {
  try {
    const parentId = req.user.id;
    const { id } = req.params;

    // Get report with full details
    const report = await prisma.progressNote.findUnique({
      where: { id },
      include: {
        child: {
          select: {
            id: true,
            name: true,
            dateOfBirth: true,
            gender: true,
            parent: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        therapist: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!report) {
      return sendResponse(res, 404, "Report not found");
    }

    // Verify this report belongs to parent's child
    if (report.child.parentId !== parentId) {
      return sendResponse(res, 403, "Not authorized to view this report");
    }

    return sendResponse(res, 200, "Report detail fetched", report);
  } catch (error) {
    console.error("Get report detail error:", error);
    return sendResponse(res, 500, "Failed to fetch report detail");
  }
};

// Get therapy schedule for parent's children
const getSchedule = async (req, res) => {
  try {
    const parentId = req.user.id;
    const { status, childId } = req.query;

    // Build where clause
    const where = {
      child: {
        parentId,
      },
    };

    // Filter by child if provided
    if (childId) {
      where.childId = childId;
    }

    // Filter by status if provided
    if (status && status !== "all") {
      if (status === "active") {
        where.isActive = true;
        where.paymentStatus = "SUCCESS";
      } else if (status === "pending") {
        where.paymentStatus = "PENDING";
      } else if (status === "completed") {
        where.isActive = false;
        where.paymentStatus = "SUCCESS";
      }
    }

    // Get therapy sessions
    const sessions = await prisma.therapySession.findMany({
      where,
      include: {
        child: {
          select: {
            id: true,
            name: true,
            dateOfBirth: true,
            gender: true,
          },
        },
        therapist: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { schedule: "desc" },
    });

    // Transform to response format
    const scheduleList = sessions.map((session) => ({
      id: session.id,
      childId: session.childId,
      childName: session.child.name,
      childDob: session.child.dateOfBirth,
      childGender: session.child.gender,
      therapistId: session.therapistId,
      therapistName: session.therapist?.name || "Belum ditugaskan",
      therapistEmail: session.therapist?.email || "",
      schedule: session.schedule,
      therapyType: session.therapyType,
      paymentStatus: session.paymentStatus,
      isActive: session.isActive,
      transactionId: session.transactionId,
      createdAt: session.createdAt.toISOString(),
    }));

    return sendResponse(res, 200, "Schedule fetched successfully", scheduleList);
  } catch (error) {
    console.error("Get schedule error:", error);
    return sendResponse(res, 500, "Failed to fetch schedule");
  }
};

// Get payment history for parent's children
const getPayments = async (req, res) => {
  try {
    const parentId = req.user.id;
    const { status, childId } = req.query;

    // Build where clause for sessions with payments
    const where = {
      child: {
        parentId,
      },
      transactionId: {
        not: null,
      },
    };

    // Filter by child if provided
    if (childId) {
      where.childId = childId;
    }

    // Filter by payment status if provided
    if (status && status !== "all") {
      where.paymentStatus = status.toUpperCase();
    }

    // Get therapy sessions with payments
    const sessions = await prisma.therapySession.findMany({
      where,
      include: {
        child: {
          select: {
            id: true,
            name: true,
            dateOfBirth: true,
            gender: true,
          },
        },
        therapist: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Base price per session (should match backend logic)
    const PRICE_PER_SESSION = 165000;

    // Transform to response format
    const paymentList = sessions.map((session) => ({
      id: session.id,
      sessionId: session.id,
      childId: session.childId,
      childName: session.child.name,
      therapyType: session.therapyType,
      therapistName: session.therapist?.name || "Belum ditugaskan",
      amount: PRICE_PER_SESSION,
      paymentStatus: session.paymentStatus,
      paymentMethod: session.therapyType.includes("Online") ? "midtrans" : "midtrans",
      transactionId: session.transactionId,
      schedule: session.schedule,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
    }));

    return sendResponse(res, 200, "Payments fetched successfully", paymentList);
  } catch (error) {
    console.error("Get payments error:", error);
    return sendResponse(res, 500, "Failed to fetch payments");
  }
};

// Book a therapy session
const bookSession = async (req, res) => {
  try {
    const parentId = req.user.id;
    const { childId, therapistId, schedule, therapyType } = req.body;

    // Validate required fields
    if (!childId || !therapistId || !schedule || !therapyType) {
      return sendResponse(res, 400, "childId, therapistId, schedule, and therapyType are required");
    }

    // Verify child belongs to parent
    const child = await prisma.child.findFirst({
      where: { id: childId, parentId },
    });

    if (!child) {
      return sendResponse(res, 404, "Child not found or not authorized");
    }

    // Verify therapist exists
    const therapist = await prisma.user.findFirst({
      where: { id: therapistId, role: "THERAPIST" },
    });

    if (!therapist) {
      return sendResponse(res, 404, "Therapist not found");
    }

    // Check if slot is already booked
    const scheduleDate = new Date(schedule);
    const slotStart = new Date(scheduleDate);
    const slotEnd = new Date(scheduleDate);
    slotEnd.setHours(slotEnd.getHours() + 1);

    const existingSession = await prisma.therapySession.findFirst({
      where: {
        therapistId,
        schedule: {
          gte: slotStart,
          lt: slotEnd,
        },
        paymentStatus: "SUCCESS",
      },
    });

    if (existingSession) {
      return sendResponse(res, 409, "This time slot is already booked");
    }

    // Create therapy session with PENDING payment
    const session = await prisma.therapySession.create({
      data: {
        childId,
        therapistId,
        schedule: scheduleDate,
        therapyType,
        paymentStatus: "PENDING",
        isActive: false,
      },
      include: {
        child: {
          select: { name: true },
        },
        therapist: {
          select: { name: true, email: true },
        },
      },
    });

    // Initialize Midtrans Snap client
    const snap = new midtransClient.Snap({
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY,
    });

    // Create Midtrans transaction
    const amount = 165000;
    const orderId = `THERAPY-${session.id}`;

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      customer_details: {
        first_name: child.name,
        email: therapist.email,
      },
      item_details: [
        {
          id: session.id,
          price: amount,
          quantity: 1,
          name: `Sesi Terapi - ${therapyType}`,
        },
      ],
    };

    // Call Midtrans Snap API
    const transaction = await snap.createTransaction(parameter);

    return sendResponse(res, 201, "Session booked successfully", {
      id: session.id,
      childName: session.child.name,
      therapistName: session.therapist.name,
      therapistEmail: session.therapist.email,
      schedule: session.schedule.toISOString(),
      therapyType: session.therapyType,
      paymentStatus: session.paymentStatus,
      paymentUrl: transaction.redirect_url,
      token: transaction.token,
      amount: amount,
    });
  } catch (error) {
    console.error("Book session error:", error);
    
    // Handle Midtrans API errors
    if (error.message && error.message.includes("Midtrans")) {
      return sendResponse(res, 502, `Midtrans Error: ${error.message}`);
    }
    
    return sendResponse(res, 500, "Failed to book session");
  }
};

module.exports = {
  getReports,
  getReportDetail,
  getSchedule,
  getPayments,
  bookSession,
};
