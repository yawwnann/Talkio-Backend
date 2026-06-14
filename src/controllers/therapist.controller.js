const prisma = require("../utils/prisma");
const { sendResponse } = require("../utils/response");
const { generatePatientReport, generateSingleProgressReport } = require("../utils/pdf-generator");
const fs = require("fs");
const { isWeekendIsoDate, formatDateYmdInTimeZone } = require("../utils/date-utils");
const {
  WORK_START_HOUR_WIB,
  WORK_END_HOUR_WIB,
  getWibHour,
} = require("../config/working-hours.config");
const {
  ROOMS_PER_SLOT,
  PENDING_RESERVATION_MINUTES,
} = require("../config/booking-capacity.config");

// Get patients scheduled with this therapist
const getPatients = async (req, res) => {
  try {
    const therapistId = req.user.id;
    const sessions = await prisma.therapySession.findMany({
      where: { therapistId },
      distinct: ["childId"],
      include: {
        child: {
          include: { parent: { select: { name: true, email: true } } },
        },
      },
    });

    const patients = await Promise.all(
      sessions.map(async (s) => {
        const child = s.child;
        const childSessions = await prisma.therapySession.findMany({
          where: { childId: child.id, therapistId },
          orderBy: { schedule: "desc" },
          take: 1,
        });
        const lastSession = childSessions[0];
        return {
          id: child.id,
          parentId: child.parentId,
          name: child.name,
          dateOfBirth: child.dateOfBirth,
          gender: child.gender,
          createdAt: child.createdAt,
          updatedAt: child.updatedAt,
          parent: child.parent,
          totalSessions: await prisma.therapySession.count({
            where: { childId: child.id, therapistId },
          }),
          lastSessionDate: lastSession?.schedule ?? null,
          sessionStatus: lastSession?.sessionStatus ?? null,
        };
      }),
    );

    return sendResponse(res, 200, "Patients fetched", patients);
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

    // Verify report exists
    const report = await prisma.progressNote.findUnique({
      where: { id },
      include: { child: true }
    });

    if (!report) {
      return sendResponse(res, 404, "Report not found");
    }

    // Generate PDF
    const pdfPath = await generateSingleProgressReport(id);

    // Check if file exists
    if (!fs.existsSync(pdfPath)) {
      return sendResponse(res, 500, "Failed to generate report");
    }

    // Send file as download
    res.download(pdfPath, `report-${report.child.name}-${Date.now()}.pdf`, (err) => {
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
        date: formatDateYmdInTimeZone(session.schedule) || "-",
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
        date: formatDateYmdInTimeZone(note.date) || "-",
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
      status,
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
    // Default status is "DRAFT", but if isPublished is true, set to "SENT"
    const reportStatus = status || "DRAFT";

    const report = await prisma.progressNote.create({
      data: {
        childId,
        therapistId,
        title,
        content: progressNotes,
        date: sessionDate ? new Date(sessionDate) : new Date(),
        status: reportStatus,
        sessionDate: sessionDate ? new Date(sessionDate) : null,
        speechClarity: speechClarity ? parseFloat(speechClarity) : null,
        vocabulary: vocabulary ? parseFloat(vocabulary) : null,
        socialInteraction: socialInteraction ? parseFloat(socialInteraction) : null,
        barriers: barriers || null,
        parentExercises: parentExercises ? JSON.stringify(parentExercises) : null,
      },
    });

    // If status is SENT, send notification to parent
    if (reportStatus === "SENT") {
      try {
        await prisma.notification.create({
          data: {
            userId: child.parentId,
            title: "📋 Laporan Baru",
            body: "Terapis telah mengirim laporan perkembangan untuk ${child.name}. Silakan查看.",
            type: "LAPORAN_BARU",
          },
        });
      } catch (notifError) {
        console.error("[Report] Failed to send notification:", notifError);
      }
    }

    return sendResponse(res, 201, reportStatus === "SENT" ? "Report sent successfully" : "Report saved as draft", report);
  } catch (error) {
    console.error("Create report error:", error);
    return sendResponse(res, 500, "Failed to create report");
  }
};

const updateReport = async (req, res) => {
  try {
    const therapistId = req.user.id;
    const { id } = req.params;
    const { title, status, progressNotes, sessionDate, speechClarity, vocabulary, socialInteraction, barriers, parentExercises } = req.body;

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
    if (title !== undefined) updateData.title = title;
    if (status) updateData.status = status;
    if (progressNotes !== undefined) updateData.content = progressNotes;
    if (sessionDate !== undefined) updateData.sessionDate = new Date(sessionDate);
    if (speechClarity !== undefined) updateData.speechClarity = speechClarity ? parseFloat(speechClarity) : null;
    if (vocabulary !== undefined) updateData.vocabulary = vocabulary ? parseFloat(vocabulary) : null;
    if (socialInteraction !== undefined) updateData.socialInteraction = socialInteraction ? parseFloat(socialInteraction) : null;
    if (barriers !== undefined) updateData.barriers = barriers;
    if (parentExercises !== undefined) updateData.parentExercises = parentExercises ? JSON.stringify(parentExercises) : null;

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

    // Sabtu/Minggu libur
    if (isWeekendIsoDate(date)) {
      return sendResponse(
        res,
        400,
        "Hari Sabtu dan Minggu libur. Silakan pilih hari lain."
      );
    }

    const selectedDate = new Date(date);
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const reservationCutoff = new Date(Date.now() - PENDING_RESERVATION_MINUTES * 60 * 1000);

    // Get all reserved sessions for this date (SUCCESS + fresh PENDING)
    const daySessions = await prisma.therapySession.findMany({
      where: {
        schedule: {
          gte: startOfDay,
          lte: endOfDay,
        },
        sessionStatus: { not: "CANCELLED" },
        OR: [
          { isActive: true },
          { paymentStatus: "SUCCESS" },
          { paymentStatus: "PENDING", createdAt: { gte: reservationCutoff } },
        ],
      },
      select: {
        schedule: true,
        therapistId: true,
      },
    });

    // Define available time slots (14:00 to 21:00 WIB, 1 hour slots)
    const availableSlots = [];
    for (let hour = WORK_START_HOUR_WIB; hour < WORK_END_HOUR_WIB; hour++) {
      const sessionsInHour = daySessions.filter((s) => getWibHour(new Date(s.schedule)) === hour);
      const bookedCount = sessionsInHour.length;
      const therapistBookedCount = therapistId
        ? sessionsInHour.filter((s) => s.therapistId === therapistId).length
        : 0;

      const remainingCapacity = Math.max(0, ROOMS_PER_SLOT - bookedCount);
      const isAvailable = bookedCount < ROOMS_PER_SLOT && (!therapistId || therapistBookedCount < 1);

      availableSlots.push({
        time: `${hour.toString().padStart(2, "0")}:00`,
        endTime: `${(hour + 1).toString().padStart(2, "0")}:00`,
        isAvailable,
        bookedCount,
        capacity: ROOMS_PER_SLOT,
        remainingCapacity,
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
        : 0;
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
      : 0;

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

    if (!therapistId || rating === undefined || !developmentTime) {
      return sendResponse(res, 400, "Fields therapistId, rating, and developmentTime are required");
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
          comment: comment || "",
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
          comment: comment || "",
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
