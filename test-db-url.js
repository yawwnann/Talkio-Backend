require('dotenv').config();
const url = process.env.DATABASE_URL || 
  `mysql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`;
console.log('Constructed DATABASE_URL:', url.replace(/:[^:]*@/, ':***@'));
