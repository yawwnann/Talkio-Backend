const request = require("supertest");
const express = require("express");
const diagnosisRoutes = require("../src/routes/diagnosis.routes");

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

app.use("/api/diagnosis", diagnosisRoutes);

describe("Diagnosis Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/diagnosis/check", () => {
    it("should create diagnosis with ML integration", async () => {
      const { PrismaClient } = require("@prisma/client");
      const prisma = new PrismaClient();
      
      const mockChild = {
        id: "11111111-1111-4111-8111-111111111111",
        parentId: "parent-uuid",
        dateOfBirth: new Date("2020-01-01"),
      };

      const mockDiagnosis = {
        id: "22222222-2222-4222-8222-222222222222",
        childId: "11111111-1111-4111-8111-111111111111",
        symptoms: ["symptom1", "symptom2"],
        riskLevel: "MEDIUM",
        score: 50,
        recommendation: "Mock recommendation",
        createdAt: new Date(),
      };

      prisma.child.findUnique.mockResolvedValue(mockChild);
      prisma.diagnosis.create.mockResolvedValue(mockDiagnosis);

      const res = await request(app)
        .post("/api/diagnosis/check")
        .send({
          childId: "11111111-1111-4111-8111-111111111111",
          symptoms: ["symptom1", "symptom2", "symptom3"],
          useML: true,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.data).toHaveProperty("risk_level");
      expect(res.body.data).toHaveProperty("next_step");
    });

    it("should return 404 if child not found", async () => {
      const { PrismaClient } = require("@prisma/client");
      const prisma = new PrismaClient();
      prisma.child.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/diagnosis/check")
        .send({
          childId: "33333333-3333-4333-8333-333333333333",
          symptoms: ["symptom1"],
        });

      expect(res.statusCode).toBe(404);
    });

    it("should return 400 for empty symptoms", async () => {
      const res = await request(app)
        .post("/api/diagnosis/check")
        .send({
          childId: "11111111-1111-4111-8111-111111111111",
          symptoms: [],
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe("GET /api/diagnosis/history/:childId", () => {
    it("should fetch diagnosis history", async () => {
      const { PrismaClient } = require("@prisma/client");
      const prisma = new PrismaClient();
      
      const mockHistory = [
        {
          id: "44444444-4444-4444-8444-444444444444",
          childId: "11111111-1111-4111-8111-111111111111",
          riskLevel: "HIGH",
          score: 85,
          createdAt: new Date(),
          mlPrediction: null,
        },
      ];

      prisma.diagnosis.findMany.mockResolvedValue(mockHistory);

      const res = await request(app).get(
        "/api/diagnosis/history/11111111-1111-4111-8111-111111111111",
      );

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data).toHaveLength(1);
    });
  });
});
