const multer = require("multer");
const path = require("path");
const uploadConfig = require("../config/upload.config");

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    ...uploadConfig.ALLOWED_PHOTO_TYPES,
    ...uploadConfig.ALLOWED_VIDEO_TYPES,
    ...uploadConfig.ALLOWED_AUDIO_TYPES,
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type. Allowed: JPEG, PNG, WEBP, MP4, MOV, AVI, MP3, AAC, WAV, M4A`,
      ),
      false,
    );
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: fileFilter,
  limits: {
    fileSize: Math.max(
      uploadConfig.getPhotoMaxSize(),
      uploadConfig.getVideoMaxSize(),
      uploadConfig.getAudioMaxSize(),
    ),
  },
});

module.exports = upload;
