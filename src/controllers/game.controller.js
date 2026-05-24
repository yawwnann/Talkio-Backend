const prisma = require("../utils/prisma");
const { sendResponse } = require("../utils/response");
const {
  getRecommendationsForChild,
} = require("../services/game-recommendation.service");

function canAccessChild(child, user) {
  if (!child || !user) return false;

  if (user.role === "PARENT") {
    return child.parentId === user.id;
  }

  return user.role === "THERAPIST" || user.role === "ADMIN";
}

const logGameResult = async (req, res) => {
  try {
    const { childId, gameScore, duration, gameType } = req.body;

    const child = await prisma.child.findUnique({ where: { id: childId } });
    if (!child) return sendResponse(res, 404, "Child not found");
    if (!canAccessChild(child, req.user)) {
      return sendResponse(res, 403, "Access denied");
    }

    const log = await prisma.gameLog.create({
      data: {
        childId,
        gameScore: parseInt(gameScore),
        duration: parseInt(duration),
        gameType,
      },
    });

    return sendResponse(res, 201, "Game progress saved", log);
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

const getGameHistory = async (req, res) => {
  try {
    const { childId } = req.params;

    const child = await prisma.child.findUnique({ where: { id: childId } });
    if (!child) return sendResponse(res, 404, "Child not found");
    if (!canAccessChild(child, req.user)) {
      return sendResponse(res, 403, "Access denied");
    }

    const logs = await prisma.gameLog.findMany({
      where: { childId },
      orderBy: { playedAt: "desc" },
    });

    return sendResponse(res, 200, "Game history fetched", logs);
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

const getGameRecommendations = async (req, res) => {
  try {
    const { childId } = req.params;

    const child = await prisma.child.findUnique({ where: { id: childId } });
    if (!child) return sendResponse(res, 404, "Child not found");
    if (!canAccessChild(child, req.user)) {
      return sendResponse(res, 403, "Access denied");
    }

    const recommendations = getRecommendationsForChild(child);
    return sendResponse(res, 200, "Game recommendations fetched", recommendations);
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

module.exports = {
  logGameResult,
  getGameHistory,
  getGameRecommendations,
};
