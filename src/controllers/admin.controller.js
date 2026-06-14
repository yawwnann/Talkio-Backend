const prisma = require("../utils/prisma");
const { sendResponse } = require("../utils/response");
const fs = require("fs").promises;
const path = require("path");
const { sendNotificationToAllAdmins } = require("../services/notification.service");
const { formatDateYmdInTimeZone } = require("../utils/date-utils");

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

const getAllAssets = async (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, "../../uploads");
    
    try {
      await fs.access(uploadsDir);
    } catch (err) {
      // Directory doesn't exist yet
      return sendResponse(res, 200, "Assets fetched", []);
    }

    const files = await fs.readdir(uploadsDir);
    const assets = [];

    for (const file of files) {
      const filePath = path.join(uploadsDir, file);
      const stats = await fs.stat(filePath);
      
      if (stats.isFile()) {
        assets.push({
          filename: file,
          url: `/uploads/${file}`,
          size: stats.size, // in bytes
          createdAt: stats.birthtime,
          mimeType: file.split('.').pop() // basic extension detection
        });
      }
    }

    // Sort newest first
    assets.sort((a, b) => b.createdAt - a.createdAt);

    return sendResponse(res, 200, "Assets fetched", assets);
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

const deleteAsset = async (req, res) => {
  try {
    const { filename } = req.params;
    if (!filename) {
      return sendResponse(res, 400, "Filename is required");
    }

    // Prevent directory traversal attacks
    const normalizedFilename = path.basename(filename);
    const filePath = path.join(__dirname, "../../uploads", normalizedFilename);

    try {
      await fs.access(filePath);
    } catch (err) {
      return sendResponse(res, 404, "Asset not found");
    }

    await fs.unlink(filePath);

    // Also try to find if it's referenced in ProgressUpload or EducationContent and update if necessary,
    // though just deleting the file is the primary goal for freeing up space.
    // For now, simple file deletion.

    return sendResponse(res, 200, "Asset deleted successfully");
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

const uploadAsset = async (req, res) => {
  try {
    if (!req.file) {
      return sendResponse(res, 400, "No file uploaded");
    }

    const { filename, size, mimetype } = req.file;
    const fileStat = await fs.stat(req.file.path);

    return sendResponse(res, 201, "Asset uploaded successfully", {
      filename,
      url: `/uploads/${filename}`,
      size,
      mimeType: mimetype.split('/').pop(),
      createdAt: fileStat.birthtime,
    });
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return sendResponse(res, 400, "Name, email, and password are required");
    }

    const validRole = role || "THERAPIST";
    if (!["THERAPIST", "PARENT"].includes(validRole)) {
      return sendResponse(res, 400, "Role must be THERAPIST or PARENT");
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return sendResponse(res, 400, "Email already registered");
    }

    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: validRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isBlocked: true,
        createdAt: true,
      },
    });

    // Send notification to all admins about new user
    try {
      if (validRole === "THERAPIST") {
        await sendNotificationToAllAdmins({
          title: "Terapis Baru",
          body: `${name} terdaftar sebagai terapis baru`,
          type: "NEW_THERAPIST",
        });
      } else {
        await sendNotificationToAllAdmins({
          title: "Pengguna Baru",
          body: `${name} terdaftar sebagai orang tua`,
          type: "NEW_PARENT",
        });
      }
    } catch (notifError) {
      console.error("Failed to send admin notification:", notifError);
    }

    return sendResponse(res, 201, "User created successfully", user);
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

const getAdminPayments = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.paymentStatus = status;
    if (search) {
      where.OR = [
        { child: { name: { contains: search } } },
        { therapist: { name: { contains: search } } },
        { id: { contains: search } },
      ];
    }

    const sessions = await prisma.therapySession.findMany({
      where,
      include: {
        child: { select: { id: true, name: true } },
        therapist: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: parseInt(limit),
    });

    const total = await prisma.therapySession.count({ where });
    const PRICE_PER_SESSION = 165000;

    const transactions = sessions.map((s) => ({
      id: s.id,
      transactionId: s.transactionId || `TRX-${s.id.slice(0, 8)}`,
      sessionId: s.id,
      patientName: s.child?.name || "-",
      therapistName: s.therapist?.name || "-",
      therapistEmail: s.therapist?.email || "-",
      therapyType: s.therapyType,
      amount: PRICE_PER_SESSION,
      status: s.paymentStatus,
      date: s.createdAt.toISOString(),
      paymentMethod: "bank_transfer",
      schedule: s.schedule.toISOString(),
    }));

    const successCount = await prisma.therapySession.count({
      where: { ...where, paymentStatus: "SUCCESS" },
    });
    const pendingCount = await prisma.therapySession.count({
      where: { ...where, paymentStatus: "PENDING" },
    });
    const failedCount = await prisma.therapySession.count({
      where: { ...where, paymentStatus: "FAILED" },
    });

    return sendResponse(res, 200, "Payments fetched", {
      transactions,
      summary: { success: successCount, pending: pendingCount, failed: failedCount },
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

const resetUserPin = async (req, res) => {
  try {
    const { id } = req.params;
    const { recoveryPin } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return sendResponse(res, 404, "User not found");
    }

    if (!recoveryPin || recoveryPin.length !== 6 || !/^\d{6}$/.test(recoveryPin)) {
      return sendResponse(res, 400, "PIN harus 6 digit angka");
    }

    const bcrypt = require("bcryptjs");
    const hashedPin = await bcrypt.hash(recoveryPin, 10);

    await prisma.user.update({
      where: { id },
      data: { recoveryPin: hashedPin },
    });

    return sendResponse(res, 200, "PIN pemulihan berhasil direset", {
      userId: id,
      email: user.email,
      name: user.name,
    });
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return sendResponse(res, 404, "User not found");
    }

    // Default password for reset
    const defaultPassword = "terapi123";
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return sendResponse(res, 200, "Kata sandi berhasil direset", {
      userId: id,
      email: user.email,
      name: user.name,
      defaultPassword: defaultPassword,
    });
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

const getAdminReports = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { child: { name: { contains: search } } },
        { therapist: { name: { contains: search } } },
        { title: { contains: search } },
      ];
    }

    const notes = await prisma.progressNote.findMany({
      where,
      include: {
        child: { select: { id: true, name: true } },
        therapist: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: parseInt(limit),
    });

    const total = await prisma.progressNote.count({ where });

    const sentCount = await prisma.progressNote.count({
      where: { ...where, status: "SENT" },
    });
    const draftCount = await prisma.progressNote.count({
      where: { ...where, status: "DRAFT" },
    });

    const reports = notes.map((n) => ({
      id: n.id,
      childName: n.child?.name || "-",
      therapistName: n.therapist?.name || "-",
      therapistEmail: n.therapist?.email || "-",
      title: n.title,
      content: n.content,
      status: n.status,
      date: formatDateYmdInTimeZone(n.date) || "-",
      createdAt: formatDateYmdInTimeZone(n.createdAt) || "-",
    }));

    return sendResponse(res, 200, "Reports fetched", {
      reports,
      summary: { sent: sentCount, draft: draftCount },
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
  resetUserPassword,
  addEducationContent,
  getAllUsers,
  getAllAssets,
  deleteAsset,
  uploadAsset,
  getAdminPayments,
  getAdminReports,
  createUser,
  resetUserPin,
};
