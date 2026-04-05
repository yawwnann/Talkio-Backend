const prisma = require("../utils/prisma");
const { sendResponse } = require("../utils/response");

const getDashboardStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Date range filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.lte = new Date(endDate);
    }

    const userCount = await prisma.user.count();
    const parentCount = await prisma.user.count({ where: { role: "PARENT" } });
    const therapistCount = await prisma.user.count({ where: { role: "THERAPIST" } });
    const childrenCount = await prisma.child.count();
    
    // Count successful therapy sessions
    const sessionCount = await prisma.therapySession.count({
      where: { paymentStatus: "SUCCESS" },
    });

    // Calculate actual revenue from successful sessions
    const successfulSessions = await prisma.therapySession.findMany({
      where: { paymentStatus: "SUCCESS" },
      select: { therapyType: true },
    });

    // Base price per session
    const PRICE_PER_SESSION = 165000;
    const revenue = successfulSessions.length * PRICE_PER_SESSION;

    // Additional stats
    const diagnosisCount = await prisma.diagnosis.count();
    const highRiskCount = await prisma.diagnosis.count({
      where: { riskLevel: "HIGH" },
    });
    const activeTherapyCount = await prisma.therapySession.count({
      where: { isActive: true },
    });

    return sendResponse(res, 200, "Dashboard stats fetched", {
      userCount,
      parentCount,
      therapistCount,
      childrenCount,
      sessionCount,
      activeTherapyCount,
      diagnosisCount,
      highRiskCount,
      revenue,
      revenueFormatted: `Rp ${revenue.toLocaleString("id-ID")}`,
    });
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

const manageUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;

    // Prevent admin from blocking/deleting themselves
    if (id === req.user.id) {
      return sendResponse(res, 400, "Cannot perform action on your own account");
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return sendResponse(res, 404, "User not found");
    }

    if (action === "delete") {
      // Delete user and all related data
      await prisma.user.delete({
        where: { id },
      });
      return sendResponse(res, 200, "User deleted successfully");
    }

    if (action === "block") {
      await prisma.user.update({
        where: { id },
        data: {
          isBlocked: true,
          blockedReason: reason || "Blocked by admin",
        },
      });
      return sendResponse(res, 200, "User blocked successfully", {
        userId: id,
        reason: reason || "Blocked by admin",
      });
    }

    if (action === "unblock") {
      await prisma.user.update({
        where: { id },
        data: {
          isBlocked: false,
          blockedReason: null,
        },
      });
      return sendResponse(res, 200, "User unblocked successfully");
    }

    return sendResponse(res, 400, "Action not supported. Use: block, unblock, or delete");
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

const addEducationContent = async (req, res) => {
  try {
    const { title, content, type } = req.body;
    const authorId = req.user.id;

    // Validate type
    if (!["ARTICLE", "VIDEO"].includes(type)) {
      return sendResponse(res, 400, "Type must be ARTICLE or VIDEO");
    }

    const newContent = await prisma.educationContent.create({
      data: {
        title,
        content,
        type,
        authorId,
      },
    });

    return sendResponse(res, 201, "Content added", newContent);
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;
    
    const where = {};
    if (role) where.role = role;
    if (search) {
      // MySQL is case-insensitive by default with utf8mb4 collation
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isBlocked: true,
        blockedReason: true,
        createdAt: true,
        _count: {
          select: role === "PARENT" ? { children: true } : { therapySessions: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: parseInt(limit),
    });

    const total = await prisma.user.count({ where });

    return sendResponse(res, 200, "Users fetched", {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

module.exports = {
  getDashboardStats,
  manageUser,
  addEducationContent,
  getAllUsers,
};
