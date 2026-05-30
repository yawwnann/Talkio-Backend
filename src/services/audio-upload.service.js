/**
 * Audio Upload Service
 * Upload file audio recording artikulasi ke Cloudinary (primary)
 * dengan fallback ke local VPS storage
 */

const fs = require("fs");
const path = require("path");
const cloudinary = require("../config/cloudinary.config");

const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads", "recordings");

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Upload audio dari buffer ke Cloudinary
 * @param {Buffer} buffer - audio file buffer
 * @param {string} filename - nama file original
 * @param {string} childId - ID anak (untuk naming)
 * @returns {Promise<{secure_url, public_id, bytes, format, duration}>}
 */
async function uploadFromBufferCloudinary(buffer, filename, childId = "unknown") {
  console.log(`[AudioUpload] Cloudinary upload - filename: ${filename}, childId: ${childId}`);
  console.log(`[AudioUpload] Buffer length: ${buffer?.length} bytes`);

  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
    console.error('[AudioUpload] ERROR: Buffer is empty or invalid!');
    throw new Error('Buffer is empty or invalid');
  }

  const ext = path.extname(filename).toLowerCase() || '.m4a';
  const safeId = childId.replace(/[^a-zA-Z0-9]/g, "_");
  const publicId = `${safeId}_${Date.now()}`;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: "video",
        folder: "articulation_audio",
        format: ext.replace(".", ""),
      },
      (error, result) => {
        if (error) {
          console.error('[AudioUpload] Cloudinary upload error:', error);
          reject(error);
        } else {
          console.log(`[AudioUpload] Cloudinary success: ${result.secure_url} (${result.bytes} bytes)`);
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
            bytes: result.bytes,
            format: result.format,
            duration: result.duration,
          });
        }
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Upload audio dari buffer ke storage lokal (fallback)
 * @param {Buffer} buffer - audio file buffer
 * @param {string} filename - nama file original
 * @param {string} childId - ID anak (untuk naming)
 * @returns {Promise<{secure_url, public_id, bytes, format}>}
 */
async function uploadFromBufferLocal(buffer, filename, childId = "unknown") {
  console.log(`[AudioUpload] Local upload (fallback) - filename: ${filename}, childId: ${childId}`);
  console.log(`[AudioUpload] Buffer length: ${buffer?.length} bytes`);

  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
    console.error('[AudioUpload] ERROR: Buffer is empty or invalid!');
    throw new Error('Buffer is empty or invalid');
  }

  // Determine format from extension
  const ext = path.extname(filename).toLowerCase() || '.m4a';
  const safeId = childId.replace(/[^a-zA-Z0-9]/g, "_");
  const uniqueFilename = `${safeId}_${Date.now()}${ext}`;
  const filepath = path.join(UPLOAD_DIR, uniqueFilename);

  // Simpan file langsung
  fs.writeFileSync(filepath, buffer);

  // Verify file was written
  const stats = fs.statSync(filepath);
  console.log(`[AudioUpload] File saved: ${filepath} (${stats.size} bytes)`);

  // Bangun URL akses
  const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
  const url = `${baseUrl}/uploads/recordings/${uniqueFilename}`;

  return {
    secure_url: url,
    public_id: uniqueFilename,
    bytes: buffer.length,
    format: ext.replace(".", ""),
  };
}

/**
 * Hapus file audio dari storage lokal
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

function fileExists(publicId) {
  const filepath = path.join(UPLOAD_DIR, publicId);
  return fs.existsSync(filepath);
}

function getFilePath(publicId) {
  return path.join(UPLOAD_DIR, publicId);
}

module.exports = {
  uploadFromBufferCloudinary,
  uploadFromBufferLocal,
  deleteLocalFile,
  fileExists,
  getFilePath,
  UPLOAD_DIR,
};
