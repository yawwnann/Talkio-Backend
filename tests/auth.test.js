const request = require("supertest");
const express = require("express");
const authController = require("../src/controllers/auth.controller");
const authRoutes = require("../src/routes/auth.routes");

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);

describe("Auth Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const newUser = {
        email: "test@example.com",
        password: "password123",
        name: "Test User",
        role: "PARENT",
      };

      const mockUser = {
        id: "uuid-123",
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const { PrismaClient } = require("@prisma/client");
      const prisma = new PrismaClient();
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser);

      const res = await request(app)
        .post("/api/auth/register")
        .send(newUser);

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.data.email).toBe(newUser.email);
      expect(res.body.data).not.toHaveProperty("password");
    });

    it("should return 400 if email already exists", async () => {
      const { PrismaClient } = require("@prisma/client");
      const prisma = new PrismaClient();
      prisma.user.findUnique.mockResolvedValue({ id: "existing-id" });

      const res = await request(app)
        .post("/api/auth/register")
        .send({
          email: "existing@example.com",
          password: "password123",
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("already registered");
    });

    it("should return 400 if password is too short", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          email: "test@example.com",
          password: "12345",
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login user successfully", async () => {
      const { PrismaClient } = require("@prisma/client");
      const bcrypt = require("bcryptjs");
      const prisma = new PrismaClient();
      
      const hashedPassword = await bcrypt.hash("password123", 10);
      const mockUser = {
        id: "uuid-123",
        email: "test@example.com",
        password: hashedPassword,
        role: "PARENT",
        name: "Test User",
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);

      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "password123",
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data).toHaveProperty("token");
      expect(res.body.data.user).not.toHaveProperty("password");
    });

    it("should return 400 for invalid credentials", async () => {
      const { PrismaClient } = require("@prisma/client");
      const prisma = new PrismaClient();
      prisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "wrongpassword",
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("Invalid");
    });
  });
});
