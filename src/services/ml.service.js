const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const mlConfig = require("../config/ml.config");
const prisma = require("../utils/prisma");

class MLService {
  constructor() {
    this.baseURL = mlConfig.SERVICE_URL;
    this.timeout = mlConfig.API_TIMEOUT;
    this.modelVersion = mlConfig.MODEL_VERSION;
    this.retryCount = mlConfig.RETRY_COUNT;
  }

  /**
   * Predict speech delay risk from symptom features
   * @param {string} childId - The child's UUID
   * @param {Array} features - Array of numerical features
   * @param {Object} symptomsData - Original symptom data for storage
   * @returns {Object} Prediction result with risk level, score, confidence
   */
  async predictSpeechDelay(childId, features, symptomsData) {
    const endpoint = `${this.baseURL}${mlConfig.ENDPOINTS.SPEECH_DELAY}`;

    try {
      const response = await this._withRetry(async () => {
        return await axios.post(
          endpoint,
          {
            child_id: childId,
            features: features,
            model_version: this.modelVersion,
          },
          {
            timeout: this.timeout,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      });

      const predictionData = response.data;

      // Save to database for future retraining
      await this._savePrediction({
        childId,
        inputData: symptomsData,
        predictionResult: predictionData.score || predictionData.probability,
        actualLabel: null, // Will be updated by therapist feedback
      });

      return {
        success: true,
        riskLevel: this._mapRiskLevel(predictionData),
        score: predictionData.score || predictionData.probability || 0,
        confidence: predictionData.confidence || null,
        recommendation: this._generateRecommendation(predictionData),
        modelVersion: this.modelVersion,
        mlData: predictionData,
      };
    } catch (error) {
      console.error("ML Service - Speech delay prediction error:", error.message);
      return {
        success: false,
        error: "ML service unavailable",
        fallback: true,
      };
    }
  }

  /**
   * Analyze voice/audio file for speech patterns
   * @param {string} audioFilePath - Path to the audio file
   * @param {string} childId - The child's UUID
   * @returns {Object} Analysis result
   */
  async analyzeVoice(audioFilePath, childId) {
    const endpoint = `${this.baseURL}${mlConfig.ENDPOINTS.VOICE_ANALYSIS}`;

    try {
      // Create form data with audio file
      const formData = new FormData();
      formData.append("audio", fs.createReadStream(audioFilePath));
      formData.append("child_id", childId);

      const response = await this._withRetry(async () => {
        return await axios.post(endpoint, formData, {
          timeout: this.timeout * 2, // Audio analysis takes longer
          headers: {
            ...formData.getHeaders(),
          },
        });
      });

      const analysisData = response.data;

      return {
        success: true,
        analysis: analysisData,
        recommendations: analysisData.recommendations || [],
        modelVersion: this.modelVersion,
      };
    } catch (error) {
      console.error("ML Service - Voice analysis error:", error.message);
      return {
        success: false,
        error: "ML service unavailable for voice analysis",
        fallback: true,
      };
    }
  }

  /**
   * Save prediction to database for future model retraining
   */
  async _savePrediction({ childId, inputData, predictionResult, actualLabel }) {
    try {
      // Find the latest diagnosis for this child
      const latestDiagnosis = await prisma.diagnosis.findFirst({
        where: { childId },
        orderBy: { createdAt: "desc" },
      });

      if (latestDiagnosis) {
        await prisma.mlPrediction.create({
          data: {
            diagnosisId: latestDiagnosis.id,
            inputData: inputData,
            modelVersion: this.modelVersion,
            predictionResult: parseFloat(predictionResult) || 0,
            actualLabel: actualLabel,
          },
        });
      }
    } catch (error) {
      console.error("Failed to save prediction:", error.message);
      // Don't throw error - this is non-critical
    }
  }

  /**
   * Map prediction score to risk level
   */
  _mapRiskLevel(predictionData) {
    const score = predictionData.score || predictionData.probability || 0;

    if (score >= 0.7) {
      return "HIGH";
    } else if (score >= 0.3) {
      return "MEDIUM";
    } else {
      return "LOW";
    }
  }

  /**
   * Generate recommendation based on prediction result
   */
  _generateRecommendation(predictionData) {
    const score = predictionData.score || predictionData.probability || 0;
    const riskLevel = this._mapRiskLevel(predictionData);

    if (riskLevel === "HIGH") {
      return predictionData.recommendation || 
        "Segera jadwalkan konsultasi dengan terapis bicara profesional.";
    } else if (riskLevel === "MEDIUM") {
      return predictionData.recommendation || 
        "Perlu observasi lebih lanjut. Pantau perkembangan anak secara berkala.";
    } else {
      return predictionData.recommendation || 
        "Terus pantau perkembangan bicara anak. Tidak ada risiko terdeteksi.";
    }
  }

  /**
   * Retry helper for API calls
   */
  async _withRetry(fn, retriesLeft = this.retryCount) {
    try {
      return await fn();
    } catch (error) {
      if (retriesLeft === 0) {
        throw error;
      }
      console.warn(`ML Service retry... (${retriesLeft} attempts left)`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return this._withRetry(fn, retriesLeft - 1);
    }
  }

  /**
   * Health check - verify ML service is accessible
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${this.baseURL}/health`, {
        timeout: 3000,
      });
      return {
        status: "healthy",
        service: this.baseURL,
        ...response.data,
      };
    } catch (error) {
      return {
        status: "unhealthy",
        service: this.baseURL,
        error: error.message,
      };
    }
  }
}

module.exports = new MLService();
