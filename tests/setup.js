// Test setup file
const { sendResponse } = require("../src/utils/response");

// Mock Prisma
jest.mock("@prisma/client", () => {
  const mPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    child: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    diagnosis: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    therapySession: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    gameLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    progressUpload: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    mlPrediction: {
      create: jest.fn(),
    },
    educationContent: {
      create: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mPrisma) };
});

// Mock external services
jest.mock("../src/config/midtrans.config", () => ({
  initializeMidtrans: jest.fn(() => ({
    createTransaction: jest.fn().mockResolvedValue({
      redirect_url: "https://mock-payment.com/pay/123",
      token: "mock-token-123",
    }),
  })),
  THERAPY_PRICE: 165000,
}));

jest.mock("../src/services/ml.service", () => ({
  predictSpeechDelay: jest.fn().mockResolvedValue({
    success: true,
    riskLevel: "MEDIUM",
    score: 0.5,
    confidence: 0.8,
    recommendation: "Mock recommendation",
    modelVersion: "v1.0.0",
  }),
  analyzeVoice: jest.fn().mockResolvedValue({
    success: true,
    analysis: {},
    recommendations: [],
    modelVersion: "v1.0.0",
  }),
  healthCheck: jest.fn().mockResolvedValue({
    status: "healthy",
    service: "http://localhost:5000",
  }),
}));

// Suppress console during tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
};
