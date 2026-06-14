const prisma = require("../utils/prisma");
const { sendResponse } = require("../utils/response");
const midtransClient = require("midtrans-client");
const { generatePatientReport } = require("../utils/pdf-generator");
const fs = require("fs");
const { formatDateYmdInTimeZone } = require("../utils/date-utils");

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
      date: formatDateYmdInTimeZone(note.date) || "-",
      createdAt: formatDateYmdInTimeZone(note.createdAt) || "-",
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
            parentId: true,
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

    // Auto-update past sessions to inactive (completed)
    await prisma.therapySession.updateMany({
      where: {
        isActive: true,
        schedule: { lt: new Date() },
      },
      data: {
        isActive: false,
      },
    });

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
    const scheduleList = sessions.map((session) => {
      // Convert schedule to ISO string with proper timezone handling
      const scheduleDate = session.schedule instanceof Date
        ? session.schedule.toISOString()
        : new Date(session.schedule).toISOString();

      return {
        id: session.id,
        childId: session.childId,
        childName: session.child.name,
        childDob: session.child.dateOfBirth,
        childGender: session.child.gender,
        therapistId: session.therapistId,
        therapistName: session.therapist?.name || "Belum ditugaskan",
        therapistEmail: session.therapist?.email || "",
        schedule: scheduleDate,
        therapyType: session.therapyType,
        paymentStatus: session.paymentStatus,
        isActive: session.isActive,
        transactionId: session.transactionId,
        createdAt: session.createdAt.toISOString(),
      };
    });

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
      paymentUrl: session.paymentUrl,
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

// Download PDF report for parent's child
const downloadPdfReport = async (req, res) => {
  try {
    const parentId = req.user.id;
    const { childId } = req.params;

    // Verify child belongs to parent
    const child = await prisma.child.findFirst({
      where: {
        id: childId,
        parentId: parentId,
      },
    });

    if (!child) {
      return sendResponse(res, 404, "Anak tidak ditemukan atau bukan milik Anda");
    }

    // Generate PDF
    const pdfPath = await generatePatientReport(childId);

    if (!fs.existsSync(pdfPath)) {
      return sendResponse(res, 500, "Gagal membuat laporan PDF");
    }

    res.download(pdfPath, `Laporan-Perkembangan-${child.name}-${Date.now()}.pdf`, (err) => {
      if (err) {
        console.error("PDF download error:", err);
        return sendResponse(res, 500, "Gagal mengunduh PDF");
      }
    });
  } catch (error) {
    console.error("Download PDF error:", error);
    return sendResponse(res, 500, "Gagal membuat laporan PDF");
  }
};

module.exports = {
  getReports,
  getReportDetail,
  getSchedule,
  getPayments,
  downloadPdfReport,
};
