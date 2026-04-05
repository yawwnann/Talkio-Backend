const fs = require("fs");
const path = require("path");

class AudioService {
  /**
   * Validate audio file integrity
   * @param {string} filePath - Path to audio file
   * @returns {Object} Validation result with metadata
   */
  async validateAudioFile(filePath) {
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return {
          valid: false,
          error: "File does not exist",
        };
      }

      // Get file stats
      const stats = fs.statSync(filePath);
      const fileSizeMB = stats.size / (1024 * 1024);

      // Check file size (max 20MB)
      if (fileSizeMB > 20) {
        return {
          valid: false,
          error: "File too large. Maximum size is 20MB",
        };
      }

      // Get file extension and mimetype
      const ext = path.extname(filePath).toLowerCase();
      const mimeType = this.getMimeType(ext);

      // Validate audio type
      const allowedExtensions = [".mp3", ".m4a", ".aac", ".wav", ".mp4"];
      if (!allowedExtensions.includes(ext)) {
        return {
          valid: false,
          error: `Invalid audio format. Allowed: ${allowedExtensions.join(", ")}`,
        };
      }

      return {
        valid: true,
        metadata: {
          fileSize: stats.size,
          fileSizeMB: fileSizeMB.toFixed(2),
          extension: ext,
          mimeType,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
        },
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
      };
    }
  }

  /**
   * Get MIME type from file extension
   */
  getMimeType(ext) {
    const mimeTypes = {
      ".mp3": "audio/mpeg",
      ".m4a": "audio/mp4",
      ".aac": "audio/aac",
      ".wav": "audio/wav",
      ".mp4": "audio/mp4",
    };
    return mimeTypes[ext] || "application/octet-stream";
  }

  /**
   * Delete audio file
   */
  async deleteFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to delete file:", error.message);
      return false;
    }
  }

  /**
   * Note: FFmpeg conversion placeholder
   * If your ML model requires specific format (e.g., WAV 16kHz),
   * install fluent-ffmpeg and implement conversion here
   */
  async convertToWav(inputPath, outputPath) {
    // Placeholder for FFmpeg conversion
    // Example: ffmpeg -i input.m4a -ar 16000 -ac 1 output.wav
    
    console.warn("FFmpeg conversion not implemented yet");
    console.warn("Install fluent-ffmpeg and configure conversion if needed");
    
    // For now, just copy the file
    fs.copyFileSync(inputPath, outputPath);
    return outputPath;
  }
}

module.exports = new AudioService();
