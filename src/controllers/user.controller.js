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
        createdAt: true,
      },
    });

    if (!user) return sendResponse(res, 404, "User not found");

    return sendResponse(res, 200, "Profile fetched", user);
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

module.exports = {
  getProfile,
};
