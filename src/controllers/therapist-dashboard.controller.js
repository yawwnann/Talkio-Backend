const prisma = require("../utils/prisma");
const { sendResponse } = require("../utils/response");

// Get dashboard statistics for therapist
const getDashboardStats = async (req, res) => {
  try {
    const therapistId = req.user.id;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get today's sessions
    const todaySessions = await prisma.therapySession.findMany({
      where: {
        therapistId,
        schedule: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        child: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        schedule: 'asc',
      },
    });

    // Get recent updates (last 7 days) - ONLY progress notes (reports), not sessions
    const recentReports = await prisma.progressNote.findMany({
      where: {
        therapistId,
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      include: {
        child: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 6,
    });

    // Also get recent sessions for mixed updates
    const recentSessions = await prisma.therapySession.findMany({
      where: {
        therapistId,
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      include: {
        child: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 3, // Take fewer sessions, prioritize reports
    });

    // Combine and sort by createdAt
    const allUpdates = [
      ...recentReports.map((note) => ({
        id: note.id,
        childName: note.child.name,
        type: 'REPORT',
        createdAt: note.createdAt,
        therapyType: null,
        title: note.title,
      })),
      ...recentSessions.map((session) => ({
        id: session.id,
        childName: session.child.name,
        type: 'SESSION',
        createdAt: session.createdAt,
        therapyType: session.therapyType,
        title: null,
      })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);

    // Get active patients (patients with sessions in last 30 days)
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activePatients = await prisma.therapySession.findMany({
      where: {
        therapistId,
        schedule: {
          gte: thirtyDaysAgo,
        },
      },
      distinct: ["childId"],
      include: {
        child: {
          select: {
            id: true,
            name: true,
            dateOfBirth: true,
          },
        },
      },
      orderBy: {
        schedule: 'desc',
      },
    });

    // Get progress uploads for trends (last 7 days)
    const progressUploads = await prisma.progressUpload.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate improvement trends (mock calculation based on available data)
    const totalProgressUploads = progressUploads.length;
    const averageImprovement = totalProgressUploads > 0 
      ? Math.round((totalProgressUploads / 30) * 100) / 10 // Simplified calculation
      : 0;

    // Build dashboard data
    const dashboardData = {
      todaySchedule: {
        count: todaySessions.length,
        sessions: todaySessions.map((session) => ({
          id: session.id,
          childId: session.childId,
          childName: session.child.name,
          time: session.schedule,
          therapyType: session.therapyType,
          status: session.isActive ? 'SCHEDULED' : 'CANCELLED',
        })),
      },
      recentUpdates: allUpdates,
      activePatients: {
        count: activePatients.length,
        patients: activePatients.map((patient) => ({
          id: patient.childId,
          name: patient.child.name,
          lastSession: patient.schedule,
        })),
      },
      trends: {
        averageImprovement: `${averageImprovement > 0 ? '+' : ''}${averageImprovement}%`,
        vocabularyScore: totalProgressUploads > 0 ? '+24%' : '0%',
        dailyEngagement: totalProgressUploads > 0 ? '+12%' : '0%',
      },
      summary: {
        newRecordings: recentSessions.filter((s) => s.therapyType === 'RECORDING').length,
        pendingReports: recentReports.length,
      },
    };

    return sendResponse(res, 200, "Dashboard stats fetched successfully", dashboardData);
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    return sendResponse(res, 500, "Failed to fetch dashboard stats");
  }
};

module.exports = {
  getDashboardStats,
};
