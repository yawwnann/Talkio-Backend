const multer = require("multer");
const path = require("path");
const fs = require("fs");
const uploadConfig = require("../config/upload.config");

// Ensure upload directory exists
if (!fs.existsSync(uploadConfig.UPLOAD_DIR)) {
  fs.mkdirSync(uploadConfig.UPLOAD_DIR, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadConfig.UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    const basename = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, "");
    cb(null, `${file.fieldname}-${uniqueSuffix}-${basename}${ext}`);
  },
});

// File filter for validation
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
        `Invalid file type. Allowed: JPEG, PNG, WEBP, MP4, MOV, AVI, MP3, AAC, WAV, M4A`
      ),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: Math.max(
      uploadConfig.getPhotoMaxSize(),
      uploadConfig.getVideoMaxSize(),
      uploadConfig.getAudioMaxSize()
    ),
  },
});

module.exports = upload;
