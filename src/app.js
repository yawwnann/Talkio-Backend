const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { globalErrorHandler, jsonErrorWrapper } = require("./middlewares/error.middleware");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(helmet());

const morganFormat = process.env.NODE_ENV === "production" ? "short" : "dev";
app.use(morgan(morganFormat));

// Body parsers — wrapped with error-catcher so Express 5 json() throws
// are forwarded to next(err) instead of crashing the whole function.
app.use(express.json({ type: "*/*", limit: "10mb" }), jsonErrorWrapper);
app.use(express.urlencoded({ extended: true, limit: "10mb" }), jsonErrorWrapper);

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANT: Never `require()` a module that opens a DB / file / network
// connection at the TOP LEVEL before module.exports = app.
// If that module throws during startup Vercel captures stdout as the HTTP
// response body and leaks secrets / stack traces to visitors.
// Keep all connection-heavy requires INSIDE route handler functions.
// ─────────────────────────────────────────────────────────────────────────────

// ── Routes ──────────────────────────────────────────────────────────────────
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const childRoutes = require("./routes/child.routes");
const diagnosisRoutes = require("./routes/diagnosis.routes");
const therapyRoutes = require("./routes/therapy.routes");
const gameRoutes = require("./routes/game.routes");
const progressRoutes = require("./routes/progress.routes");
const therapistRoutes = require("./routes/therapist");
const assetRoutes = require("./routes/asset.routes");
const adminRoutes = require("./routes/admin.routes");
const paymentRoutes = require("./routes/payment.routes");
const audioRoutes = require("./routes/audio.routes");
const educationRoutes = require("./routes/education.routes");
const parentRoutes = require("./routes/parent.routes");
const notificationRoutes = require("./routes/notification.routes");

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/children", childRoutes);
app.use("/api/diagnosis", diagnosisRoutes);
app.use("/api/therapy", therapyRoutes);
app.use("/api/game", gameRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/therapist", therapistRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/assets", assetRoutes);

app.use("/api/payment", paymentRoutes);
app.use("/api/v1/audio", audioRoutes);
app.use("/api/education", educationRoutes);
app.use("/api/parent", parentRoutes);
app.use("/api/notifications", notificationRoutes);

// ── Static files ─────────────────────────────────────────────────────────────
app.use("/uploads", express.static("uploads"));

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({
    status: "success",
    message: "Welcome to Speech Delay Detection API",
    version: "1.0.0",
    env: process.env.NODE_ENV || "development",
  });
});

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({
    status: "success",
    message: "Welcome to Speech Delay Detection API",
    version: "1.0.0",
    env: process.env.NODE_ENV || "development",
  });
});

// ── Dev Seed endpoint (REMOVE after seeding) ──────────────────────────────────
const bcrypt = require("bcryptjs");
// ── Debug: check DB state (TEMPORARY) ────────────────────────────────────────
app.get("/api/debug/db", async (_req, res) => {
  try {
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();
    const users = await prisma.user.findMany({ select: { id: true, email: true, role: true } });
    const children = await prisma.child.findMany();
    const sessions = await prisma.therapySession.findMany({
      select: { id: true, childId: true, therapistId: true, isActive: true, sessionStatus: true },
    });
    res.json({ users: users.length, children: children.length, sessions: sessions.length, sessionList: sessions });
    await prisma.$disconnect();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Global error handler (must be LAST) ──────────────────────────────────────
app.use(globalErrorHandler);

// ── Export for Vercel / serverless ───────────────────────────────────────────
module.exports = app;

// Only listen when run locally (not Vercel)
if (require.main === module) {
  const http = require("http");
  const { initWebSocket } = require("./websocket");

  const server = http.createServer(app);
  
  // Initialize WebSocket
  initWebSocket(server);

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
