const request = require("supertest");
const express = require("express");

const therapyRoutes = require("../src/routes/therapy.routes");
const therapistRoutes = require("../src/routes/therapist.routes");

// Mock auth as parent
jest.mock("../src/middlewares/auth.middleware", () => ({
  authenticateToken: (req, _res, next) => {
    req.user = { id: "parent-uuid", role: "PARENT", email: "parent@test.com" };
    next();
  },
  authorizeRoles: (..._roles) => (_req, _res, next) => next(),
}));

describe("Weekend booking guard (backend)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-05-24T10:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("POST /api/therapy/booking rejects Saturday/Sunday", async () => {
    const app = express();
    app.use(express.json());
    app.use("/api/therapy", therapyRoutes);

    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();

    const childId = "11111111-1111-4111-8111-111111111111";

    prisma.child.findUnique.mockResolvedValue({
      id: childId,
      parentId: "parent-uuid",
      name: "Anak Test",
    });

    const res = await request(app)
      .post("/api/therapy/booking")
      .send({
        childId,
        schedule: "2026-05-30T14:00:00+07:00", // Saturday
        therapyType: "SPEECH",
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe("error");
    expect(res.body.message).toMatch(/Sabtu|Minggu|libur/i);
    expect(prisma.therapySession.create).not.toHaveBeenCalled();
  });

  test("GET /api/therapist/availability rejects Saturday/Sunday", async () => {
    const app = express();
    app.use(express.json());
    app.use("/api/therapist", therapistRoutes);

    const res = await request(app)
      .get("/api/therapist/availability")
      .query({ date: "2026-05-30" }); // Saturday

    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe("error");
    expect(res.body.message).toMatch(/Sabtu|Minggu|libur/i);
  });
});
