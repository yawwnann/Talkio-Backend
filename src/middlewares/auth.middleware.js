const jwt = require("jsonwebtoken");
const { sendResponse } = require("../utils/response");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return sendResponse(res, 401, "Access denied. No token provided.");
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    return sendResponse(res, 403, "Invalid token.");
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return sendResponse(
        res,
        403,
        "Access denied. You do not have permission.",
      );
    }
    next();
  };
};

module.exports = { authenticateToken, authorizeRoles };
