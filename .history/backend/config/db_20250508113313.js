const { Pool } = require('pg');
require('dotenv').config();

// Unified configuration
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'superadmin_db',
  password: process.env.DB_PASSWORD || 'pass', // Default from first file
  port: process.env.DB_PORT || 5432,
};

const mainPool = new Pool(dbConfig);

// Test database connection
mainPool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Successfully connected to PostgreSQL');
  release();
});

// Handle pool errors
mainPool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'your_db_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'your_db_name',
  password: process.env.DB_PASSWORD || 'your_db_password',
  port: process.env.DB_PORT || 5432,
});

module.exports = pool;

// Export both the pool and configuration
module.exports = { mainPool, dbConfig };