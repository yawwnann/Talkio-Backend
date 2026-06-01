const prisma = require("../utils/prisma");
const { sendResponse } = require("../utils/response");

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        recoveryPin: true,
        createdAt: true,
      },
    });

    if (!user) return sendResponse(res, 404, "User not found");

    const { recoveryPin, ...safeUser } = user;
    return sendResponse(res, 200, "Profile fetched", {
      ...safeUser,
      hasRecoveryPin: recoveryPin !== null,
    });
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;

    if (Object.keys(updateData).length === 0) {
      return sendResponse(res, 400, "No data to update");
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return sendResponse(res, 200, "Profile updated successfully", user);
  } catch (error) {
    console.error(error);
    if (error.code === "P2025") {
      return sendResponse(res, 404, "User not found");
    }
    return sendResponse(res, 500, "Internal Server Error");
  }
};

module.exports = {
  getProfile,
  updateProfile,
};
