const request = require("supertest");
const express = require("express");
const childRoutes = require("../src/routes/child.routes");

const app = express();
app.use(express.json());

// Mock JWT verification
jest.mock("../src/middlewares/auth.middleware", () => ({
  authenticateToken: (req, res, next) => {
    req.user = { id: "parent-uuid", role: "PARENT", email: "parent@test.com" };
    next();
  },
  authorizeRoles: (...roles) => (req, res, next) => next(),
}));

app.use("/api/children", childRoutes);

describe("Child Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/children", () => {
    it("should create a new child successfully", async () => {
      const { PrismaClient } = require("@prisma/client");
      const prisma = new PrismaClient();
      
      const mockChild = {
        id: "child-uuid",
        parentId: "parent-uuid",
        name: "Test Child",
        dateOfBirth: new Date("2020-01-01"),
        gender: "MALE",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.child.create.mockResolvedValue(mockChild);

      const res = await request(app)
        .post("/api/children")
        .send({
          name: "Test Child",
          dateOfBirth: "2020-01-01",
          gender: "MALE",
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.data.name).toBe("Test Child");
    });

    it("should return 400 for invalid data", async () => {
      const res = await request(app)
        .post("/api/children")
        .send({
          name: "",
          dateOfBirth: "invalid-date",
          gender: "INVALID",
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe("GET /api/children", () => {
    it("should fetch all children for the parent", async () => {
      const { PrismaClient } = require("@prisma/client");
      const prisma = new PrismaClient();
      
      const mockChildren = [
        {
          id: "child-1",
          parentId: "parent-uuid",
          name: "Child 1",
          dateOfBirth: new Date("2020-01-01"),
          gender: "MALE",
        },
        {
          id: "child-2",
          parentId: "parent-uuid",
          name: "Child 2",
          dateOfBirth: new Date("2021-05-15"),
          gender: "FEMALE",
        },
      ];

      prisma.child.findMany.mockResolvedValue(mockChildren);

      const res = await request(app).get("/api/children");

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data).toHaveLength(2);
    });
  });
});
