const prisma = require("../utils/prisma");
const { sendResponse } = require("../utils/response");

// ============================================
// PUBLIC ENDPOINTS (Untuk Orang Tua/User)
// ============================================

// Get all education content (with filtering)
const getAllEducation = async (req, res) => {
  try {
    const { type, isActive, search, page = 1, limit = 10 } = req.query;

    // Build filter query
    const where = {};
    
    if (type && ['ARTICLE', 'VIDEO'].includes(type)) {
      where.type = type;
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // Search by title or description
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // Count total
    const total = await prisma.educationContent.count({ where });

    // Get content with pagination
    const contents = await prisma.educationContent.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    });

    // Extract YouTube video ID for embed
    const contentsWithEmbed = contents.map(content => {
      if (content.type === 'VIDEO') {
        const videoId = extractYouTubeVideoId(content.content);
        return {
          ...content,
          embedUrl: videoId ? `https://www.youtube.com/embed/${videoId}` : null,
          videoId,
        };
      }
      return content;
    });

    return sendResponse(res, 200, "Education contents fetched successfully", {
      contents: contentsWithEmbed,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

// Get single education content by ID
const getEducationById = async (req, res) => {
  try {
    const { id } = req.params;

    const content = await prisma.educationContent.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    if (!content) {
      return sendResponse(res, 404, "Education content not found");
    }

    // Extract YouTube video ID for embed
    let contentWithEmbed = content;
    if (content.type === 'VIDEO') {
      const videoId = extractYouTubeVideoId(content.content);
      contentWithEmbed = {
        ...content,
        embedUrl: videoId ? `https://www.youtube.com/embed/${videoId}` : null,
        videoId,
      };
    }

    return sendResponse(res, 200, "Education content fetched successfully", contentWithEmbed);
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

// ============================================
// ADMIN ENDPOINTS
// ============================================

// Create education content
const createEducation = async (req, res) => {
  try {
    const { title, description, content, type, thumbnail, isActive, order } = req.body;
    const authorId = req.user.id; // From JWT token

    // Validate type
    if (!['ARTICLE', 'VIDEO'].includes(type)) {
      return sendResponse(res, 400, "Type must be 'ARTICLE' or 'VIDEO'");
    }

    // Validate YouTube URL if type is VIDEO
    if (type === 'VIDEO' && !isValidYouTubeUrl(content)) {
      return sendResponse(res, 400, "Invalid YouTube URL. Please provide a valid YouTube video link.");
    }

    const newContent = await prisma.educationContent.create({
      data: {
        title,
        description,
        content,
        type,
        thumbnail,
        authorId,
        isActive: isActive !== undefined ? isActive : true,
        order: order || 0,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    // Add embed info if video
    if (type === 'VIDEO') {
      const videoId = extractYouTubeVideoId(newContent.content);
      newContent.embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : null;
      newContent.videoId = videoId;
    }

    return sendResponse(res, 201, "Education content created successfully", newContent);
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

// Update education content
const updateEducation = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, content, type, thumbnail, isActive, order } = req.body;

    // Check if content exists
    const existing = await prisma.educationContent.findUnique({
      where: { id },
    });

    if (!existing) {
      return sendResponse(res, 404, "Education content not found");
    }

    // Validate type if changed
    if (type && !['ARTICLE', 'VIDEO'].includes(type)) {
      return sendResponse(res, 400, "Type must be 'ARTICLE' or 'VIDEO'");
    }

    // Validate YouTube URL if type is VIDEO
    const contentType = type || existing.type;
    const contentUrl = content || existing.content;
    if (contentType === 'VIDEO' && !isValidYouTubeUrl(contentUrl)) {
      return sendResponse(res, 400, "Invalid YouTube URL. Please provide a valid YouTube video link.");
    }

    const updatedContent = await prisma.educationContent.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(content && { content }),
        ...(type && { type }),
        ...(thumbnail !== undefined && { thumbnail }),
        ...(isActive !== undefined && { isActive }),
        ...(order !== undefined && { order }),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    // Add embed info if video
    if (updatedContent.type === 'VIDEO') {
      const videoId = extractYouTubeVideoId(updatedContent.content);
      updatedContent.embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : null;
      updatedContent.videoId = videoId;
    }

    return sendResponse(res, 200, "Education content updated successfully", updatedContent);
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

// Delete education content
const deleteEducation = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if content exists
    const existing = await prisma.educationContent.findUnique({
      where: { id },
    });

    if (!existing) {
      return sendResponse(res, 404, "Education content not found");
    }

    await prisma.educationContent.delete({
      where: { id },
    });

    return sendResponse(res, 200, "Education content deleted successfully");
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

// Toggle active status
const toggleEducationStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.educationContent.findUnique({
      where: { id },
    });

    if (!existing) {
      return sendResponse(res, 404, "Education content not found");
    }

    const updated = await prisma.educationContent.update({
      where: { id },
      data: {
        isActive: !existing.isActive,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return sendResponse(res, 200, "Education content status toggled successfully", updated);
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

// Extract YouTube video ID from various URL formats
function extractYouTubeVideoId(url) {
  if (!url) return null;
  
  // Patterns supported:
  // https://www.youtube.com/watch?v=VIDEO_ID
  // https://youtu.be/VIDEO_ID
  // https://www.youtube.com/embed/VIDEO_ID
  // https://www.youtube.com/v/VIDEO_ID
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/, // Just the video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

// Validate YouTube URL
function isValidYouTubeUrl(url) {
  if (!url) return false;
  
  const patterns = [
    /^https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)[a-zA-Z0-9_-]{11}/,
    /^https?:\/\/youtu\.be\/[a-zA-Z0-9_-]{11}/,
    /^[a-zA-Z0-9_-]{11}$/, // Just the video ID
  ];

  return patterns.some(pattern => pattern.test(url));
}

module.exports = {
  getAllEducation,
  getEducationById,
  createEducation,
  updateEducation,
  deleteEducation,
  toggleEducationStatus,
};
