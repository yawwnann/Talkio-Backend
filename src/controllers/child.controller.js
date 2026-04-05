const prisma = require("../utils/prisma");
const { sendResponse } = require("../utils/response");

const createChild = async (req, res) => {
  try {
    const { name, dateOfBirth, gender } = req.body;
    const parentId = req.user.id; // From JWT

    const newChild = await prisma.child.create({
      data: {
        parentId,
        name,
        dateOfBirth: new Date(dateOfBirth),
        gender,
      },
    });

    return sendResponse(res, 201, "Child added successfully", newChild);
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

const getChildren = async (req, res) => {
  try {
    const parentId = req.user.id;
    const children = await prisma.child.findMany({
      where: { parentId },
    });
    return sendResponse(res, 200, "Children fetched successfully", children);
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

const getChildById = async (req, res) => {
  try {
    const { id } = req.params;
    const child = await prisma.child.findUnique({
      where: { id },
      include: {
        diagnoses: true,
        therapySessions: true,
        gameLogs: true,
        progressUploads: true,
      },
    });

    if (!child) {
      return sendResponse(res, 404, "Child not found");
    }

    // Ensure only the parent or a therapist can view
    // (Therapist logic could be more complex, e.g., if assigned)
    if (
      child.parentId !== req.user.id &&
      req.user.role !== "THERAPIST" &&
      req.user.role !== "ADMIN"
    ) {
      return sendResponse(res, 403, "Access denied.");
    }

    return sendResponse(res, 200, "Child details fetched successfully", child);
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

module.exports = {
  createChild,
  getChildren,
  getChildById,
};
