const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let io; // To hold the singleton instance

const initWebSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // Adjust this in production for security
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
  });

  // Middleware for authentication
  io.use((socket, next) => {
    try {
      // Token usually comes from socket.handshake.auth.token
      // or from socket.handshake.headers.authorization
      let token = socket.handshake.auth?.token;
      
      if (!token && socket.handshake.headers.authorization) {
        token = socket.handshake.headers.authorization.split(" ")[1];
      }

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      // Verify JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Attach user info to socket
      socket.user = decoded; // Assume decoded contains at least id and role
      socket.userId = decoded.id; 
      socket.userRole = decoded.role;
      
      next();
    } catch (err) {
      console.error("WebSocket Auth Error:", err.message);
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`[WebSocket] User connected: ${socket.userId} (${socket.userRole})`);

    // Join personal room for targeted notifications
    if (socket.userId) {
      socket.join(`user_${socket.userId}`);
    }

    // Join role-based room
    if (socket.userRole) {
      socket.join(`${socket.userRole}_room`);
    }

    // Handle user presence
    socket.on("presence", (status) => {
      console.log(`User ${socket.userId} is ${status}`);
      // Future: broadcast presence to relevant rooms
    });

    // Handle joining therapy room (example)
    socket.on("join_therapy", (therapyId) => {
      // In a real app, verify if the user has access to this therapy session first
      socket.join(`therapy_${therapyId}`);
      console.log(`[WebSocket] User ${socket.userId} joined therapy_${therapyId}`);
    });

    // Handle leaving therapy room
    socket.on("leave_therapy", (therapyId) => {
      socket.leave(`therapy_${therapyId}`);
      console.log(`[WebSocket] User ${socket.userId} left therapy_${therapyId}`);
    });

    socket.on("disconnect", () => {
      console.log(`[WebSocket] User disconnected: ${socket.userId}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io is not initialized!");
  }
  return io;
};

module.exports = {
  initWebSocket,
  getIO,
};
