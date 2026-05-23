import { defineConfig } from "prisma/config";
import { config } from "dotenv";

// Load .env file only if it exists (does not exist in Vercel production)
config({ path: ".env" });

// Prefer DATABASE_URL if directly provided (Vercel env var or manual),
// otherwise construct from individual TiDB-specific env variables.
let DATABASE_URL: string | undefined = process.env.DATABASE_URL;

if (!DATABASE_URL && process.env.DB_HOST && process.env.DB_USERNAME) {
  DATABASE_URL = `mysql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 3306}/${process.env.DB_DATABASE}?sslaccept=strict`;
}

if (!DATABASE_URL) {
  console.error(
    "❌ Missing DATABASE_URL. Set either DATABASE_URL directly or DB_HOST, DB_USERNAME, DB_PASSWORD, DB_DATABASE.",
  );
  process.exit(1);
}

console.log(
  "Using DATABASE_URL:",
  DATABASE_URL.replace(/:[^:]*@/, ":***@"),
);

// Inject the resolved URL into process.env so Prisma schema env("DATABASE_URL") picks it up
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
