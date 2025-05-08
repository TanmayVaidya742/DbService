const express = require('express');
const { Pool } = require('pg');
const checkUserAuth = require('../middleware/checkUserAuth');
const router = express.Router();

// Admin pool to create databases (connected to the default 'postgres' DB)
const adminPool = new Pool({
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'pass',
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || 5432,
  database: 'postgres',
});

// 🔹 Create DB and default table (accessible to all users)
router.post('/create-database', checkUserAuth, async (req, res) => {
  const user = req.user;

  // Sanitize organization name for DB name and username for table name
  const dbName = user.organization.replace(/\W/g, '_').toLowerCase();      // e.g., hdfc_org
  const tableName = user.username.replace(/\W/g, '_').toLowerCase();       // e.g., john_doe_22

  try {
    // Step 1: Try creating the DB (ignore error if it exists)
    await adminPool.query(`CREATE DATABASE ${dbName}`);
  } catch (err) {
    if (err.code !== '42P04') {
      console.error('Database creation error:', err);
      return res.status(500).json({ message: 'Database creation failed', error: err.message });
    }
  }

  // Step 2: Connect to the newly created DB
  const userDbPool = new Pool({
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'pass',
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    database: dbName,
  });

  try {
    // Step 3: Create a default table named after the user
    await userDbPool.query(`
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id SERIAL PRIMARY KEY,
        data JSONB,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )9854


    `);

    res.json({
      message: 'Database and default table created successfully',
      database: dbName,
      table: tableName,
    });
  } catch (err) {39
    console.error('Table creation error:', err);
    res.status(500).json({ message: 'Table creation failed', error: err.message });
  }
});

module.exports = router;
