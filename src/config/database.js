require("dotenv").config({ override: true });

// Prefer DATABASE_URL if set directly
let DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL && process.env.DB_HOST && process.env.DB_USERNAME) {
  DATABASE_URL =
    process.env.DB_PASSWORD != null
      ? `mysql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 3306}/${process.env.DB_DATABASE}?sslaccept=strict`
      : `mysql://${process.env.DB_USERNAME}@${process.env.DB_HOST}:${process.env.DB_PORT || 3306}/${process.env.DB_DATABASE}?sslaccept=strict`;
}

module.exports = { DATABASE_URL };
