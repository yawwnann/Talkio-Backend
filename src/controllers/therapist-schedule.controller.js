const prisma = require("../utils/prisma");
const { sendResponse } = require("../utils/response");

// Get therapist schedule for a specific date or date range
const getSchedule = async (req, res) => {
  try {
    const therapistId = req.user.id;
    const { startDate, endDate } = req.query;

    // Auto-update past sessions to CANCELLED if they were not explicitly completed
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    await prisma.therapySession.updateMany({
      where: {
        sessionStatus: "SCHEDULED",
        schedule: { lt: oneHourAgo },
      },
      data: {
        sessionStatus: "CANCELLED",
      },
    });

    // Build date filter
    const whereClause = {
      therapistId,
    };

    if (startDate || endDate) {
      whereClause.schedule = {};
      if (startDate) {
        whereClause.schedule.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.schedule.lte = new Date(endDate);
      }
    } else {
      // Default: get today's schedule
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      whereClause.schedule = {
        gte: today,
        lt: tomorrow,
      };
    }

    const sessions = await prisma.therapySession.findMany({
      where: whereClause,
      include: {
        child: {
          select: {
            id: true,
            name: true,
            dateOfBirth: true,
            gender: true,
          },
        },
      },
      orderBy: {
        schedule: 'asc',
      },
    });

    // Transform data for frontend
    const scheduleItems = sessions.map((session) => ({
      id: session.id,
      childId: session.childId,
      childName: session.child.name,
      childGender: session.child.gender,
      schedule: session.schedule,
      therapyType: session.therapyType,
      isActive: session.isActive,
      status: getSessionStatus(session),
    }));

    return sendResponse(res, 200, "Schedule fetched successfully", scheduleItems);
  } catch (error) {
    console.error("Get schedule error:", error);
    return sendResponse(res, 500, "Failed to fetch schedule");
  }
};

// Create a new schedule/session
const createSchedule = async (req, res) => {
  try {
    const therapistId = req.user.id;
    const { childId, schedule, therapyType, isActive } = req.body;

    // Validate required fields
    if (!childId || !schedule || !therapyType) {
      return sendResponse(res, 400, "childId, schedule, and therapyType are required");
    }

    // Check if child exists
    const child = await prisma.child.findUnique({
      where: { id: childId },
    });

    if (!child) {
      return sendResponse(res, 404, "Child not found");
    }

    // Check for scheduling conflicts
    const scheduleDate = new Date(schedule);
    const oneHourLater = new Date(scheduleDate.getTime() + 60 * 60 * 1000);

    const conflict = await prisma.therapySession.findFirst({
      where: {
        therapistId,
        schedule: {
          gte: scheduleDate,
          lt: oneHourLater,
        },
      },
    });

    if (conflict) {
      return sendResponse(res, 409, "Schedule conflict: You already have a session at this time");
    }

    // Create the session
    const newSession = await prisma.therapySession.create({
      data: {
        childId,
        therapistId,
        schedule: scheduleDate,
        therapyType,
        isActive: isActive || false,
      },
      include: {
        child: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return sendResponse(res, 201, "Schedule created successfully", newSession);
  } catch (error) {
    console.error("Create schedule error:", error);
    return sendResponse(res, 500, "Failed to create schedule");
  }
};

// Update a schedule/session
const updateSchedule = async (req, res) => {
  try {
    const therapistId = req.user.id;
    const { id } = req.params;
    const { schedule, therapyType, isActive } = req.body;

    // Check if session exists and belongs to this therapist
    const existingSession = await prisma.therapySession.findUnique({
      where: { id },
    });

    if (!existingSession) {
      return sendResponse(res, 404, "Session not found");
    }

    if (existingSession.therapistId !== therapistId) {
      return sendResponse(res, 403, "Not authorized to update this session");
    }

    // Update the session
    const updatedSession = await prisma.therapySession.update({
      where: { id },
      data: {
        ...(schedule && { schedule: new Date(schedule) }),
        ...(therapyType && { therapyType }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        child: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return sendResponse(res, 200, "Schedule updated successfully", updatedSession);
  } catch (error) {
    console.error("Update schedule error:", error);
    return sendResponse(res, 500, "Failed to update schedule");
  }
};

// Delete a schedule/session
const deleteSchedule = async (req, res) => {
  try {
    const therapistId = req.user.id;
    const { id } = req.params;

    // Check if session exists and belongs to this therapist
    const existingSession = await prisma.therapySession.findUnique({
      where: { id },
    });

    if (!existingSession) {
      return sendResponse(res, 404, "Session not found");
    }

    if (existingSession.therapistId !== therapistId) {
      return sendResponse(res, 403, "Not authorized to delete this session");
    }

    // Delete the session
    await prisma.therapySession.delete({
      where: { id },
    });

    return sendResponse(res, 200, "Schedule deleted successfully");
  } catch (error) {
    console.error("Delete schedule error:", error);
    return sendResponse(res, 500, "Failed to delete schedule");
  }
};

// Helper function to determine session status
function getSessionStatus(session) {
  const now = new Date();
  const sessionTime = new Date(session.schedule);
  const oneHourAfter = new Date(sessionTime.getTime() + 60 * 60 * 1000);

  // If status is already completed or cancelled, return it
  if (session.sessionStatus === 'COMPLETED' || session.sessionStatus === 'CANCELLED') {
    return session.sessionStatus;
  }

  // If it is scheduled but the time has passed, it should have been updated by getSchedule to CANCELLED.
  // But just in case, we can also return CANCELLED here dynamically.
  if (now > oneHourAfter && session.sessionStatus !== 'COMPLETED') {
    return 'CANCELLED';
  }

  if (sessionTime > now) {
    return 'SCHEDULED';
  }

  if (sessionTime <= now && now <= oneHourAfter) {
    return 'ONGOING';
  }

  return session.sessionStatus;
}

// Complete a schedule/session
const completeSchedule = async (req, res) => {
  try {
    const therapistId = req.user.id;
    const { id } = req.params;

    // Check if session exists and belongs to this therapist
    const existingSession = await prisma.therapySession.findUnique({
      where: { id },
    });

    if (!existingSession) {
      return sendResponse(res, 404, "Session not found");
    }

    if (existingSession.therapistId !== therapistId) {
      return sendResponse(res, 403, "Not authorized to complete this session");
    }

    // Update the session status
    const updatedSession = await prisma.therapySession.update({
      where: { id },
      data: { sessionStatus: 'COMPLETED' },
    });

    return sendResponse(res, 200, "Schedule completed successfully", updatedSession);
  } catch (error) {
    console.error("Complete schedule error:", error);
    return sendResponse(res, 500, "Failed to complete schedule");
  }
};

module.exports = {
  getSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  completeSchedule,
};
