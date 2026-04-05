require("dotenv").config({ override: true });

const DATABASE_URL = 
  (process.env.DB_HOST && process.env.DB_USERNAME)
    ? `mysql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 4000}/${process.env.DB_DATABASE}?sslaccept=strict`
    : process.env.DATABASE_URL;

module.exports = { DATABASE_URL };
