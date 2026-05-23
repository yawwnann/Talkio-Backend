const { PrismaClient } = require("@prisma/client");

// DATABASE_URL is set as a Vercel environment variable in vercel.json.
// Prisma reads it via schema env("DATABASE_URL") at build/generate time.
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set — database operations will fail.");
}

const prisma = new PrismaClient({
  // log: process.env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["error"],
});

module.exports = prisma;
