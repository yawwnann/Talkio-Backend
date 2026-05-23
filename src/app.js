require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { globalErrorHandler } = require("./middlewares/error.middleware");

// WARNING: Any console.log / console.error at TOP LEVEL of a module
// that is required during startup will appear in the HTTP response
// if Prisma or any other module crashes before the server is ready.
// Keep this block lean and silent.

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(helmet());

// Use short format in production to reduce noise in response body on crash
const morganFormat = process.env.NODE_ENV === "production" ? "short" : "dev";
app.use(morgan(morganFormat));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
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
const mlRoutes = require("./routes/ml.routes");
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

// New routes
app.use("/api/payment", paymentRoutes);
app.use("/api/v1/predict", mlRoutes);
app.use("/api/v1/audio", audioRoutes);
app.use("/api/education", educationRoutes);
app.use("/api/parent", parentRoutes);

// Serve static files
app.use("/uploads", express.static("uploads"));

// Health check
app.get("/", (req, res) => {
  res.json({ 
    message: "Welcome to Speech Delay Detection API",
    version: "1.0.0",
    status: "running"
  });
});

// Global error handler (must be last)
app.use(globalErrorHandler);

// Export the app for use in serverless
module.exports = app;

// Only start the server if this file is run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  });
}
