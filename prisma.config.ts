import { defineConfig } from "prisma/config";
import { config } from "dotenv";

// Load .env file with override to ensure .env takes precedence over system env vars
config({ path: ".env", override: true });

// Construct DATABASE_URL from TiDB-specific env variables (highest priority)
// TiDB Cloud requires SSL connection
const DATABASE_URL =
  process.env.DB_HOST && process.env.DB_USERNAME
    ? `mysql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 4000}/${process.env.DB_DATABASE}?sslaccept=strict`
    : process.env.DATABASE_URL;

console.log("Using DATABASE_URL:", DATABASE_URL?.replace(/:[^:]*@/, ":***@"));

// Inject the constructed URL into process.env so it can be picked up by the schema env("DATABASE_URL") function
process.env.DATABASE_URL = DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    provider: "mysql",
    url: DATABASE_URL,
  },
});
