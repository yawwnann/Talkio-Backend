const path = require("path");

module.exports = {
  UPLOAD_DIR: path.join(__dirname, "..", "..", "uploads"),
  MAX_PHOTO_SIZE: parseInt(process.env.MAX_PHOTO_SIZE_MB) || 10,
  MAX_VIDEO_SIZE: parseInt(process.env.MAX_VIDEO_SIZE_MB) || 50,
  MAX_AUDIO_SIZE: 20, // MB
  ALLOWED_PHOTO_TYPES: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  ALLOWED_VIDEO_TYPES: ["video/mp4", "video/quicktime", "video/x-msvideo"],
  ALLOWED_AUDIO_TYPES: ["audio/mpeg", "audio/mp4", "audio/aac", "audio/wav", "audio/x-m4a"],
  
  // Size in bytes for multer
  getPhotoMaxSize() {
    return this.MAX_PHOTO_SIZE * 1024 * 1024;
  },
  getVideoMaxSize() {
    return this.MAX_VIDEO_SIZE * 1024 * 1024;
  },
  getAudioMaxSize() {
    return this.MAX_AUDIO_SIZE * 1024 * 1024;
  },
};
