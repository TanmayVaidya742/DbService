// db.js
const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'superadmin_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
};

const mainPool = new Pool(dbConfig);

module.exports = { mainPool, dbConfig };
 