const prisma = require("../utils/prisma");
const { sendResponse } = require("../utils/response");

// Create progress note
const createNote = async (req, res) => {
  try {
    const { childId, title, content, date } = req.body;
    const therapistId = req.user.id;

    if (!childId || !title || !content) {
      return sendResponse(res, 400, "Child ID, title, and content are required");
    }

    // Verify child exists
    const child = await prisma.child.findUnique({ where: { id: childId } });
    if (!child) return sendResponse(res, 404, "Child not found");

    const note = await prisma.progressNote.create({
      data: {
        childId,
        therapistId,
        title,
        content,
        date: date ? new Date(date) : new Date(),
      },
      include: {
        child: { select: { name: true } },
        therapist: { select: { name: true } },
      },
    });

    return sendResponse(res, 201, "Progress note created", note);
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

// Get notes by child ID
const getNotesByChild = async (req, res) => {
  try {
    const { childId } = req.params;

    const child = await prisma.child.findUnique({ where: { id: childId } });
    if (!child) return sendResponse(res, 404, "Child not found");

    const notes = await prisma.progressNote.findMany({
      where: { childId },
      orderBy: { date: "desc" },
      include: {
        child: { select: { name: true } },
        therapist: { select: { name: true } },
      },
    });

    return sendResponse(res, 200, "Notes fetched", notes);
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

// Update note
const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, date } = req.body;

    const existingNote = await prisma.progressNote.findUnique({ where: { id } });
    if (!existingNote) return sendResponse(res, 404, "Note not found");

    // Verify therapist owns this note
    if (existingNote.therapistId !== req.user.id) {
      return sendResponse(res, 403, "Access denied");
    }

    const note = await prisma.progressNote.update({
      where: { id },
      data: {
        title: title || existingNote.title,
        content: content || existingNote.content,
        date: date ? new Date(date) : existingNote.date,
      },
      include: {
        child: { select: { name: true } },
        therapist: { select: { name: true } },
      },
    });

    return sendResponse(res, 200, "Note updated", note);
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

// Delete note
const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;

    const existingNote = await prisma.progressNote.findUnique({ where: { id } });
    if (!existingNote) return sendResponse(res, 404, "Note not found");

    // Verify therapist owns this note
    if (existingNote.therapistId !== req.user.id) {
      return sendResponse(res, 403, "Access denied");
    }

    await prisma.progressNote.delete({ where: { id } });

    return sendResponse(res, 200, "Note deleted");
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

module.exports = {
  createNote,
  getNotesByChild,
  updateNote,
  deleteNote,
};
