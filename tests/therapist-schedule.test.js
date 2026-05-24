const request = require("supertest");
const express = require("express");
const therapistScheduleRoutes = require("../src/routes/therapist-schedule.routes");

const app = express();
app.use(express.json());

// Mock auth to act as therapist
jest.mock("../src/middlewares/auth.middleware", () => ({
  authenticateToken: (req, _res, next) => {
    req.user = { id: "therapist-uuid", role: "THERAPIST", email: "t@test.com" };
    next();
  },
  authorizeRoles: (..._roles) => (_req, _res, next) => next(),
}));

app.use("/api/therapist", therapistScheduleRoutes);

describe("Therapist Schedule", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-05-24T19:50:16.060+07:00"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("GET /api/therapist/schedule", () => {
    it("should NOT auto-cancel paid sessions after the end time; status becomes PENDING_CONFIRMATION", async () => {
      const { PrismaClient } = require("@prisma/client");
      const prisma = new PrismaClient();

      prisma.therapySession.updateMany.mockResolvedValue({ count: 0 });

      const endedTwoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      prisma.therapySession.findMany.mockResolvedValue([
        {
          id: "session-1",
          therapistId: "therapist-uuid",
          childId: "child-1",
          child: {
            id: "child-1",
            name: "Anak A",
            dateOfBirth: new Date("2020-01-01"),
            gender: "MALE",
          },
          schedule: endedTwoHoursAgo,
          therapyType: "SPEECH",
          isActive: true,
          paymentStatus: "SUCCESS",
          sessionStatus: "SCHEDULED",
        },
      ]);

      const res = await request(app).get("/api/therapist/schedule");

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].status).toBe("PENDING_CONFIRMATION");

      // Ensure we update past paid sessions to PENDING_CONFIRMATION (not CANCELLED)
      expect(prisma.therapySession.updateMany).toHaveBeenCalledTimes(2);
      const secondCallArgs = prisma.therapySession.updateMany.mock.calls[1][0];
      expect(secondCallArgs.data).toEqual({ sessionStatus: "PENDING_CONFIRMATION" });
      expect(secondCallArgs.where).toEqual(
        expect.objectContaining({
          sessionStatus: "SCHEDULED",
          paymentStatus: "SUCCESS",
          schedule: expect.objectContaining({ lt: expect.any(Date) }),
        })
      );
    });
  });

  describe("PUT /api/therapist/schedule/:id/complete", () => {
    it("should complete a session and set isActive=false", async () => {
      const { PrismaClient } = require("@prisma/client");
      const prisma = new PrismaClient();

      prisma.therapySession.findUnique.mockResolvedValue({
        id: "session-1",
        therapistId: "therapist-uuid",
      });

      prisma.therapySession.update.mockResolvedValue({
        id: "session-1",
        sessionStatus: "COMPLETED",
        isActive: false,
      });

      const res = await request(app).put("/api/therapist/schedule/session-1/complete");

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.sessionStatus).toBe("COMPLETED");
      expect(res.body.data.isActive).toBe(false);

      expect(prisma.therapySession.update).toHaveBeenCalledWith({
        where: { id: "session-1" },
        data: { sessionStatus: "COMPLETED", isActive: false },
      });
    });

    it("should return 403 when therapist tries to complete someone else's session", async () => {
      const { PrismaClient } = require("@prisma/client");
      const prisma = new PrismaClient();

      prisma.therapySession.findUnique.mockResolvedValue({
        id: "session-1",
        therapistId: "other-therapist",
      });

      const res = await request(app).put("/api/therapist/schedule/session-1/complete");

      expect(res.statusCode).toBe(403);
      expect(res.body.status).toBe("error");
    });
  });
});
