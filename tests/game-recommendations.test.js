const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");

const gameRoutes = require("../src/routes/game.routes");

const { ageInMonths } = require("../src/utils/age");
const {
  getRecommendationsForChild,
} = require("../src/services/game-recommendation.service");

function makeToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET);
}

describe("Game recommendations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("ageInMonths calculates full months correctly", () => {
    const dob = new Date("2025-05-20T00:00:00.000Z");
    const now = new Date("2026-05-19T00:00:00.000Z");
    expect(ageInMonths(dob, now)).toBe(11);

    const now2 = new Date("2026-05-20T00:00:00.000Z");
    expect(ageInMonths(dob, now2)).toBe(12);
  });

  test("service returns recommendations with band and games", () => {
    const child = { id: "c1", dateOfBirth: new Date("2025-05-20"), parentId: "p1" };
    const now = new Date("2026-05-20");
    const rec = getRecommendationsForChild(child, now);

    expect(rec.childId).toBe("c1");
    expect(rec.ageMonths).toBe(12);
    expect(rec.band).toHaveProperty("label");
    expect(Array.isArray(rec.games)).toBe(true);
    expect(rec.games.length).toBeGreaterThan(0);
  });

  test("GET /api/game/recommendations/:childId returns 200 for parent owner", async () => {
    const app = express();
    app.use(express.json());
    app.use("/api/game", gameRoutes);

    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();

    prisma.child.findUnique.mockResolvedValue({
      id: "child-1",
      parentId: "parent-1",
      dateOfBirth: new Date("2025-05-20"),
    });

    const token = makeToken({ id: "parent-1", role: "PARENT" });

    const res = await request(app)
      .get("/api/game/recommendations/child-1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data).toHaveProperty("ageMonths");
    expect(res.body.data).toHaveProperty("games");
  });

  test("GET /api/game/recommendations/:childId returns 403 for non-owner parent", async () => {
    const app = express();
    app.use(express.json());
    app.use("/api/game", gameRoutes);

    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();

    prisma.child.findUnique.mockResolvedValue({
      id: "child-1",
      parentId: "parent-1",
      dateOfBirth: new Date("2025-05-20"),
    });

    const token = makeToken({ id: "parent-2", role: "PARENT" });

    const res = await request(app)
      .get("/api/game/recommendations/child-1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(403);
  });

  test("GET /api/game/recommendations/:childId returns 404 if child missing", async () => {
    const app = express();
    app.use(express.json());
    app.use("/api/game", gameRoutes);

    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();

    prisma.child.findUnique.mockResolvedValue(null);

    const token = makeToken({ id: "parent-1", role: "PARENT" });

    const res = await request(app)
      .get("/api/game/recommendations/missing")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
  });
});
