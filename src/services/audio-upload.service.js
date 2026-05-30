/**
 * Audio Upload Service - Local VPS Storage
 * Menyimpan file audio recording artikulasi ke storage lokal VPS
 * Pola sama persis dengan upload progress video di cloudinary.controller.js
 */

const fs = require("fs");
const path = require("path");

const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads", "recordings");

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Upload audio dari buffer ke storage lokal
 * @param {Buffer} buffer - audio file buffer
 * @param {string} filename - nama file original
 * @param {string} childId - ID anak (untuk naming)
 * @returns {Promise<{secure_url, public_id, bytes, format}>}
 */
async function uploadFromBufferLocal(buffer, filename, childId = "unknown") {
  const ext = path.extname(filename) || ".m4a";
  const safeId = childId.replace(/[^a-zA-Z0-9]/g, "_");
  const uniqueFilename = `${safeId}_${Date.now()}${ext}`;
  const filepath = path.join(UPLOAD_DIR, uniqueFilename);

  // Simpan file
  fs.writeFileSync(filepath, buffer);

  // Bangun URL akses
  const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
  const url = `${baseUrl}/uploads/recordings/${uniqueFilename}`;

  console.log(`[AudioUpload] Saved: ${filepath} (${buffer.length} bytes)`);

  return {
    secure_url: url,
    public_id: uniqueFilename,
    bytes: buffer.length,
    format: ext.replace(".", ""),
  };
}

/**
 * Hapus file audio dari storage lokal
 * @param {string} publicId - nama file
 * @returns {boolean}
 */
async function deleteLocalFile(publicId) {
  try {
    const filepath = path.join(UPLOAD_DIR, publicId);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      console.log(`[AudioUpload] Deleted: ${filepath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error("[AudioUpload] Delete error:", error.message);
    return false;
  }
}

/**
 * Cek apakah file ada di storage
 */
function fileExists(publicId) {
  const filepath = path.join(UPLOAD_DIR, publicId);
  return fs.existsSync(filepath);
}

/**
 * Get full path ke file
 */
function getFilePath(publicId) {
  return path.join(UPLOAD_DIR, publicId);
}

module.exports = {
  uploadFromBufferLocal,
  deleteLocalFile,
  fileExists,
  getFilePath,
  UPLOAD_DIR,
};
