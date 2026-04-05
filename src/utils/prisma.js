require("dotenv").config({ override: true });
const { PrismaClient } = require("@prisma/client");
const { DATABASE_URL } = require("../config/database");

// Set DATABASE_URL for Prisma
process.env.DATABASE_URL = DATABASE_URL;

const prisma = new PrismaClient();

module.exports = prisma;
