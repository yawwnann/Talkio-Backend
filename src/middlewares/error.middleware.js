class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// ── Prevent Express 5 json/urlencoded middleware crashes from killing the function ──
// These two middlewares wrap every incoming request so that even if the body
// parser throws (malformed JSON, oversized body, etc.) the error is forwarded
// to the next(error) chain instead of crashing the whole function.
const jsonErrorWrapper = (err, req, res, next) => {
  if (err) {
    console.error("[json-middleware-error]", err.message);
    return res.status(400).json({ status: "error", message: "Invalid request body" });
  }
  next();
};

const prismaErrorHandler = (error) => {
  if (error.code === "P2002") {
    return {
      statusCode: 409,
      message: `Duplicate field value: ${error.meta?.target?.join(", ") || "unknown"}`,
    };
  }
  if (error.code === "P2025") {
    return {
      statusCode: 404,
      message: "Record not found",
    };
  }
  return {
    statusCode: 500,
    message: "Database error occurred",
  };
};

const handleJWTError = () => ({
  statusCode: 401,
  message: "Invalid token. Please log in again.",
});

const handleJWTExpiredError = () => ({
  statusCode: 401,
  message: "Your session has expired. Please log in again.",
});

const handleValidationError = () => ({
  statusCode: 400,
  message: "Invalid input data",
});

const sendErrorDev = (err, req, res) => {
  // Do NOT log full body/env in production — just the error code/message
  console.error(err);

  if (req.originalUrl.startsWith("/api")) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      ...(err.code ? { code: err.code } : {}),
    });
  }
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  // Unexpected / unhandled error — log code + message, no stack in response
  console.error(
    "[unhandled-error]",
    err.name,
    err.code || "",
    err.message || "",
  );
  return res.status(500).json({
    status: "error",
    message: "Something went wrong!",
  });
};

const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, req, res);
    return;
  }

  const error = { ...err };

  if (error.code === "P2002" || error.code === "P2025") {
    const prismaError = prismaErrorHandler(error);
    err.statusCode = prismaError.statusCode;
    err.message = prismaError.message;
  }

  if (err.name === "JsonWebTokenError") {
    const jwtError = handleJWTError();
    err.statusCode = jwtError.statusCode;
    err.message = jwtError.message;
  }

  if (err.name === "TokenExpiredError") {
    const expiredError = handleJWTExpiredError();
    err.statusCode = expiredError.statusCode;
    err.message = expiredError.message;
  }

  if (err.name === "ValidationError") {
    const validationError = handleValidationError();
    err.statusCode = validationError.statusCode;
    err.message = validationError.message;
  }

  sendErrorProd(err, res);
};

module.exports = {
  AppError,
  globalErrorHandler,
  jsonErrorWrapper,
};
