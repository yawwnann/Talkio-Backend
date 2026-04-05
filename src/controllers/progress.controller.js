const prisma = require("../utils/prisma");
const { sendResponse } = require("../utils/response");

const uploadProgress = async (req, res) => {
  try {
    const { childId, notes } = req.body;
    const file = req.file;

    if (!file) return sendResponse(res, 400, "No file uploaded");

    const child = await prisma.child.findUnique({ where: { id: childId } });
    if (!child) return sendResponse(res, 404, "Child not found");
    if (child.parentId !== req.user.id)
      return sendResponse(res, 403, "Access denied");

    // Basic file url construction (local)
    const fileUrl = `/uploads/${file.filename}`;

    const progress = await prisma.progressUpload.create({
      data: {
        childId,
        fileUrl,
        parentNotes: notes,
      },
    });

    return sendResponse(res, 201, "Progress uploaded successfully", progress);
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

module.exports = {
  uploadProgress,
};
