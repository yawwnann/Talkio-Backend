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
const adminRoutes = require("./routes/admin.routes");
const paymentRoutes = require("./routes/payment.routes");
const audioRoutes = require("./routes/audio.routes");
const educationRoutes = require("./routes/education.routes");
const parentRoutes = require("./routes/parent.routes");

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/children", childRoutes);
app.use("/api/diagnosis", diagnosisRoutes);
app.use("/api/therapy", therapyRoutes);
app.use("/api/game", gameRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/therapist", therapistRoutes);
app.use("/api/admin", adminRoutes);

app.use("/api/payment", paymentRoutes);
app.use("/api/v1/audio", audioRoutes);
app.use("/api/education", educationRoutes);
app.use("/api/parent", parentRoutes);

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

// ── Global error handler (must be LAST) ──────────────────────────────────────
app.use(globalErrorHandler);

// ── Export for Vercel / serverless ───────────────────────────────────────────
module.exports = app;

// Only listen when run locally (not Vercel)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
