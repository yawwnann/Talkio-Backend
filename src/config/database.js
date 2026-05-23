// In production (Vercel) all env vars are injected by the platform.
// DATABASE_URL is the single source of truth — never construct it from DB_* vars
// in production to avoid leaking credentials in logs.
const DATABASE_URL = process.env.DATABASE_URL;

module.exports = { DATABASE_URL };
