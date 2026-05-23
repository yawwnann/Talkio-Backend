const prisma = require("../utils/prisma");
const { sendResponse } = require("../utils/response");
const { generatePatientReport } = require("../utils/pdf-generator");
const fs = require("fs");

// Get patients scheduled with this therapist
const getPatients = async (req, res) => {
  try {
    const therapistId = req.user.id;
    const patients = await prisma.therapySession.findMany({
      where: { therapistId, isActive: true },
      distinct: ["childId"],
      include: {
        child: {
          include: { parent: { select: { name: true, email: true } } },
        },
      },
    });

    const uniquePatients = patients.map((p) => p.child);
    return sendResponse(res, 200, "Patients fetched", uniquePatients);
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

const getPatientDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const child = await prisma.child.findUnique({
      where: { id },
      include: {
        diagnoses: true,
        therapySessions: true,
        gameLogs: true,
        progressUploads: true,
        progressNotes: true,
      },
    });

    if (!child) return sendResponse(res, 404, "Child not found");
    return sendResponse(res, 200, "Patient detail fetched", child);
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

const evaluatePatient = async (req, res) => {
  try {
    const { progressId, evaluation } = req.body;

    const progress = await prisma.progressUpload.update({
      where: { id: progressId },
      data: { therapistEvaluation: evaluation },
    });

    return sendResponse(res, 200, "Evaluation submitted", progress);
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

const generateReport = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify child exists
    const child = await prisma.child.findUnique({
      where: { id },
    });

    if (!child) {
      return sendResponse(res, 404, "Child not found");
    }

    // Generate PDF
    const pdfPath = await generatePatientReport(id);

    // Check if file exists
    if (!fs.existsSync(pdfPath)) {
      return sendResponse(res, 500, "Failed to generate report");
    }

    // Send file as download
    res.download(pdfPath, `report-${child.name}-${Date.now()}.pdf`, (err) => {
      if (err) {
        console.error("Download error:", err);
        return sendResponse(res, 500, "Failed to download report");
      }
    });
  } catch (error) {
    console.error("Report generation error:", error);
    return sendResponse(res, 500, "Failed to generate report");
  }
};

const getReportHistory = async (req, res) => {
  try {
    const therapistId = req.user.id;

    // Get progress notes created by this therapist
    const progressNotes = await prisma.progressNote.findMany({
      where: { therapistId },
      include: {
        child: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    // If no progress notes, fallback to therapy sessions as reports
    if (progressNotes.length === 0) {
      // Get therapy sessions to show as reports
      const sessions = await prisma.therapySession.findMany({
        where: { therapistId },
        include: {
          child: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { schedule: "desc" },
        take: 20,
      });

      // Transform sessions to match LaporanModel format
      const laporanFromSessions = sessions.map((session) => ({
        id: session.id,
        patient_id: session.childId,
        patient_name: session.child.name,
        patient_avatar: "",
        status: session.isActive ? "SENT" : "DRAFT",
        summary: `Sesi ${session.therapyType} - ${session.isActive ? "Aktif" : "Tidak Aktif"}`,
        date: session.schedule.toISOString().split("T")[0],
        terapis_id: therapistId,
      }));

      return sendResponse(res, 200, "Report history fetched (from sessions)", laporanFromSessions);
    }

    // Transform progress notes to match LaporanModel format
    const laporanList = progressNotes.map((note) => {
      return {
        id: note.id,
        patient_id: note.childId,
        patient_name: note.child.name,
        patient_avatar: "",
        status: note.status || "DRAFT",  // Use the actual status from database
        summary: note.content.substring(0, 100) + (note.content.length > 100 ? "..." : ""),
        date: note.date.toISOString().split("T")[0],
        terapis_id: therapistId,
      };
    });

    return sendResponse(res, 200, "Report history fetched", laporanList);
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

const createReport = async (req, res) => {
  try {
    const therapistId = req.user.id;
    const {
      childId,
      sessionId,
      speechClarity,
      vocabulary,
      socialInteraction,
      progressNotes,
      barriers,
      parentExercises,
      sessionDate,
      sessionNumber,
      title,
    } = req.body;

    // Validate required fields
    if (!childId || !title || !progressNotes) {
      return sendResponse(res, 400, "childId, title, and progressNotes are required");
    }

    // Verify child exists
    const child = await prisma.child.findUnique({
      where: { id: childId },
    });

    if (!child) {
      return sendResponse(res, 404, "Child not found");
    }

    // Create progress note (report)
    const report = await prisma.progressNote.create({
      data: {
        childId,
        therapistId,
        title,
        content: progressNotes,
        date: sessionDate ? new Date(sessionDate) : new Date(),
      },
    });

    return sendResponse(res, 201, "Report created successfully", report);
  } catch (error) {
    console.error("Create report error:", error);
    return sendResponse(res, 500, "Failed to create report");
  }
};

const updateReport = async (req, res) => {
  try {
    const therapistId = req.user.id;
    const { id } = req.params;
    const { title, status } = req.body;

    // Check if report exists
    const existingReport = await prisma.progressNote.findUnique({
      where: { id },
    });

    if (!existingReport) {
      return sendResponse(res, 404, "Report not found");
    }

    // Verify this report belongs to this therapist
    if (existingReport.therapistId !== therapistId) {
      return sendResponse(res, 403, "Not authorized to update this report");
    }

    // Build update data
    const updateData = {};
    if (title) updateData.title = title;
    if (status) updateData.status = status;
    
    // If publishing, ensure title doesn't have "Draft"
    if (status === "SENT" && existingReport.title.includes("Draft")) {
      updateData.title = existingReport.title.replace("Draft", "Laporan");
    }

    // Only update if there's data to update
    if (Object.keys(updateData).length === 0) {
      return sendResponse(res, 200, "No changes to update", existingReport);
    }

    // Update the report
    const updatedReport = await prisma.progressNote.update({
      where: { id },
      data: updateData,
    });

    return sendResponse(res, 200, "Report updated successfully", updatedReport);
  } catch (error) {
    console.error("Update report error:", error);
    return sendResponse(res, 500, "Failed to update report");
  }
};

// Get therapist availability for a specific date
const getAvailability = async (req, res) => {
  try {
    const { date, therapistId } = req.query;

    if (!date) {
      return sendResponse(res, 400, "Date parameter is required");
    }

    const selectedDate = new Date(date);
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const whereClause = {
      schedule: {
        gte: startOfDay,
        lte: endOfDay,
      },
      paymentStatus: "SUCCESS",
    };

    if (therapistId) {
      whereClause.therapistId = therapistId;
    }

    // Get all booked sessions for this date
    const bookedSessions = await prisma.therapySession.findMany({
      where: whereClause,
      select: {
        schedule: true,
        therapyType: true,
      },
    });

    // Define available time slots (9 AM to 5 PM, 1 hour slots)
    const availableSlots = [];
    for (let hour = 9; hour < 17; hour++) {
      const slotStart = new Date(selectedDate);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(selectedDate);
      slotEnd.setHours(hour + 1, 0, 0, 0);

      // Check if this slot is booked
      const isBooked = bookedSessions.some((session) => {
        const sessionStart = new Date(session.schedule);
        return sessionStart >= slotStart && sessionStart < slotEnd;
      });

      availableSlots.push({
        time: `${hour.toString().padStart(2, "0")}:00`,
        endTime: `${(hour + 1).toString().padStart(2, "0")}:00`,
        isAvailable: !isBooked,
      });
    }

    return sendResponse(res, 200, "Availability fetched", {
      date: date,
      slots: availableSlots,
    });
  } catch (error) {
    console.error("Get availability error:", error);
    return sendResponse(res, 500, "Failed to fetch availability");
  }
};

// List all therapists for parent to book
const listTherapists = async (req, res) => {
  try {
    const therapists = await prisma.user.findMany({
      where: {
        role: "THERAPIST",
        isBlocked: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: {
            therapySessions: {
              where: {
                paymentStatus: "SUCCESS",
              },
            },
          },
        },
        therapistReviews: {
          select: {
            rating: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Format response
    const therapistList = therapists.map((therapist) => {
      const reviews = therapist.therapistReviews || [];
      const averageRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 4.5; // fallback rating if no reviews yet
      return {
        id: therapist.id,
        name: therapist.name,
        email: therapist.email,
        totalSessions: therapist._count.therapySessions,
        rating: parseFloat(averageRating.toFixed(1)),
        specialization: "Terapi Bicara & Wicara",
      };
    });

    return sendResponse(res, 200, "Therapists fetched", therapistList);
  } catch (error) {
    console.error("List therapists error:", error);
    return sendResponse(res, 500, "Failed to fetch therapists");
  }
};

// Get detailed therapist profile and reviews (accessible by parent)
const getTherapistDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const therapist = await prisma.user.findFirst({
      where: {
        id,
        role: "THERAPIST",
        isBlocked: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: {
            therapySessions: {
              where: {
                paymentStatus: "SUCCESS",
              },
            },
          },
        },
        therapistReviews: {
          include: {
            parent: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!therapist) {
      return sendResponse(res, 404, "Therapist not found");
    }

    const reviews = therapist.therapistReviews || [];
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 4.5;

    const formattedReviews = reviews.map((review) => ({
      id: review.id,
      parentId: review.parentId,
      parentName: review.parent?.name || "Orang Tua",
      rating: review.rating,
      developmentTime: review.developmentTime,
      comment: review.comment,
      createdAt: review.createdAt,
    }));

    const therapistDetail = {
      id: therapist.id,
      name: therapist.name,
      email: therapist.email,
      totalSessions: therapist._count.therapySessions,
      rating: parseFloat(averageRating.toFixed(1)),
      specialization: "Terapi Bicara & Wicara",
      experience: "5+ Tahun", // Mock experience
      bio: `Dr. ${therapist.name} adalah terapis bicara profesional yang berdedikasi untuk membantu anak-anak mengatasi keterlambatan bicara. Dengan pengalaman di berbagai klinik tumbuh kembang anak, beliau merancang sesi terapi yang interaktif dan menyenangkan agar anak berkembang secara optimal.`,
      reviews: formattedReviews,
    };

    return sendResponse(res, 200, "Therapist detail fetched successfully", therapistDetail);
  } catch (error) {
    console.error("Get therapist detail error:", error);
    return sendResponse(res, 500, "Failed to fetch therapist detail");
  }
};

// Create a review/testimonial for a therapist (accessible by parent)
const createTherapistReview = async (req, res) => {
  try {
    const parentId = req.user.id;
    const { therapistId, rating, developmentTime, comment } = req.body;

    if (!therapistId || rating === undefined || !developmentTime || !comment) {
      return sendResponse(res, 400, "All fields (therapistId, rating, developmentTime, comment) are required");
    }

    // Verify therapist exists
    const therapist = await prisma.user.findFirst({
      where: {
        id: therapistId,
        role: "THERAPIST",
        isBlocked: false,
      },
    });

    if (!therapist) {
      return sendResponse(res, 404, "Therapist not found");
    }

    // Verify if parent has completed sessions with this therapist (at least 1 payment successful)
    const sessionCount = await prisma.therapySession.count({
      where: {
        therapistId,
        child: {
          parentId: parentId,
        },
        paymentStatus: "SUCCESS",
      },
    });

    if (sessionCount === 0) {
      return sendResponse(res, 403, "Anda harus melakukan minimal 1 sesi terapi sukses dengan terapis ini untuk memberikan ulasan.");
    }

    // Check if review already exists from this parent for this therapist
    const existingReview = await prisma.review.findFirst({
      where: {
        parentId,
        therapistId,
      },
    });

    let review;
    if (existingReview) {
      // Update review
      review = await prisma.review.update({
        where: { id: existingReview.id },
        data: {
          rating: parseInt(rating),
          developmentTime,
          comment,
        },
      });
    } else {
      // Create new review
      review = await prisma.review.create({
        data: {
          parentId,
          therapistId,
          rating: parseInt(rating),
          developmentTime,
          comment,
        },
      });
    }

    return sendResponse(res, 201, "Ulasan berhasil disimpan", review);
  } catch (error) {
    console.error("Create review error:", error);
    return sendResponse(res, 500, "Failed to submit review");
  }
};

module.exports = {
  getPatients,
  getPatientDetail,
  evaluatePatient,
  generateReport,
  getReportHistory,
  createReport,
  updateReport,
  getAvailability,
  listTherapists,
  getTherapistDetail,
  createTherapistReview,
};
