/**
 * Audio Upload Service - Local VPS Storage with FFmpeg Conversion
 * Menyimpan file audio recording artikulasi ke storage lokal VPS
 * Konversi M4A/AAC ke MP3 untuk kompatibilitas browser
 */

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads", "recordings");

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Convert audio to MP3 using FFmpeg
 * @param {Buffer} inputBuffer - input audio buffer
 * @param {string} inputFormat - input format (e.g., 'm4a', 'aac')
 * @returns {Promise<Buffer>} - output MP3 buffer
 */
function convertToMp3(inputBuffer, inputFormat = 'm4a') {
  return new Promise((resolve, reject) => {
    // Write input to temp file
    const tempInputPath = path.join(UPLOAD_DIR, `temp_input_${Date.now()}.${inputFormat}`);
    const tempOutputPath = path.join(UPLOAD_DIR, `temp_output_${Date.now()}.mp3`);

    fs.writeFileSync(tempInputPath, inputBuffer);
    console.log(`[AudioUpload] Written temp input: ${tempInputPath} (${inputBuffer.length} bytes)`);

    // FFmpeg conversion
    const ffmpeg = spawn('ffmpeg', [
      '-i', tempInputPath,
      '-acodec', 'libmp3lame',
      '-ab', '128k',
      '-ar', '44100',
      '-ac', '1',
      '-y', // Overwrite output
      tempOutputPath
    ]);

    let stderr = '';

    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ffmpeg.on('close', (code) => {
      // Clean up input temp file
      try {
        fs.unlinkSync(tempInputPath);
      } catch (e) {
        console.error('[AudioUpload] Failed to delete temp input:', e.message);
      }

      if (code === 0) {
        try {
          const outputBuffer = fs.readFileSync(tempOutputPath);
          const outputStats = fs.statSync(tempOutputPath);
          console.log(`[AudioUpload] Conversion successful: ${outputStats.size} bytes`);

          // Clean up output temp file
          try {
            fs.unlinkSync(tempOutputPath);
          } catch (e) {
            console.error('[AudioUpload] Failed to delete temp output:', e.message);
          }

          resolve(outputBuffer);
        } catch (readError) {
          reject(new Error(`Failed to read converted file: ${readError.message}`));
        }
      } else {
        console.error('[AudioUpload] FFmpeg error:', stderr);
        reject(new Error(`FFmpeg conversion failed with code ${code}`));
      }
    });

    ffmpeg.on('error', (err) => {
      console.error('[AudioUpload] FFmpeg spawn error:', err.message);
      // Clean up temp input if exists
      try {
        if (fs.existsSync(tempInputPath)) {
          fs.unlinkSync(tempInputPath);
        }
      } catch (e) {}
      reject(new Error(`FFmpeg not found or failed to start: ${err.message}`));
    });
  });
}

/**
 * Check if FFmpeg is available
 */
function isFfmpegAvailable() {
  return new Promise((resolve) => {
    const ffmpeg = spawn('ffmpeg', ['-version']);
    ffmpeg.on('close', (code) => {
      resolve(code === 0);
    });
    ffmpeg.on('error', () => {
      resolve(false);
    });
  });
}

/**
 * Upload audio dari buffer ke storage lokal
 * @param {Buffer} buffer - audio file buffer
 * @param {string} filename - nama file original
 * @param {string} childId - ID anak (untuk naming)
 * @returns {Promise<{secure_url, public_id, bytes, format}>}
 */
async function uploadFromBufferLocal(buffer, filename, childId = "unknown") {
  console.log(`[AudioUpload] Upload request - filename: ${filename}, childId: ${childId}`);
  console.log(`[AudioUpload] Buffer type: ${typeof buffer}, isBuffer: ${Buffer.isBuffer(buffer)}, length: ${buffer?.length}`);

  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
    console.error('[AudioUpload] ERROR: Buffer is empty or invalid!');
    throw new Error('Buffer is empty or invalid');
  }

  const safeId = childId.replace(/[^a-zA-Z0-9]/g, "_");
  const uniqueFilename = `${safeId}_${Date.now()}.mp3`;
  const filepath = path.join(UPLOAD_DIR, uniqueFilename);

  // Determine input format from filename
  const ext = path.extname(filename).toLowerCase();
  let inputFormat = 'm4a';
  if (ext === '.aac') inputFormat = 'aac';
  else if (ext === '.m4a') inputFormat = 'm4a';
  else if (ext === '.mp3') inputFormat = 'mp3';
  else if (ext === '.wav') inputFormat = 'wav';

  let finalBuffer = buffer;

  // Convert to MP3 if not already MP3
  if (inputFormat !== 'mp3') {
    try {
      console.log(`[AudioUpload] Converting ${inputFormat} to MP3...`);
      finalBuffer = await convertToMp3(buffer, inputFormat);
      console.log(`[AudioUpload] Conversion done: ${buffer.length} -> ${finalBuffer.length} bytes`);
    } catch (convertError) {
      console.error('[AudioUpload] Conversion failed, saving original:', convertError.message);
      // Fallback: save as original format if conversion fails
      const originalExt = ext || '.m4a';
      const originalFilename = `${safeId}_${Date.now()}${originalExt}`;
      const originalFilepath = path.join(UPLOAD_DIR, originalFilename);
      fs.writeFileSync(originalFilepath, buffer);
      const stats = fs.statSync(originalFilepath);
      console.log(`[AudioUpload] Saved original: ${originalFilepath} (${stats.size} bytes)`);

      const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
      return {
        secure_url: `${baseUrl}/uploads/recordings/${originalFilename}`,
        public_id: originalFilename,
        bytes: buffer.length,
        format: originalExt.replace(".", ""),
      };
    }
  }

  // Simpan file MP3
  fs.writeFileSync(filepath, finalBuffer);

  // Verify file was written
  const stats = fs.statSync(filepath);
  console.log(`[AudioUpload] File saved: ${filepath} (${stats.size} bytes)`);

  // Bangun URL akses
  const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
  const url = `${baseUrl}/uploads/recordings/${uniqueFilename}`;

  return {
    secure_url: url,
    public_id: uniqueFilename,
    bytes: finalBuffer.length,
    format: 'mp3',
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
  isFfmpegAvailable,
};
