const { PrismaClient } = require("@prisma/client");

// DATABASE_URL is injected by Vercel as an environment variable.
// On Vercel there is no .env file — do NOT load dotenv here.
const DATABASE_URL = process.env.DATABASE_URL;

const prisma = new PrismaClient();

module.exports = prisma;
