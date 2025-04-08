const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const databasesRoutes = require('./routes/databases');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Create the main connection pool
const mainPool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'superadmin_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

// Initialize database
const initializeDatabase = async () => {
  let tempPool = null;
  
  try {
    // First connect to the default postgres database
    tempPool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      port: process.env.DB_PORT || 5432,
    });

    // Test connection
    await tempPool.query('SELECT 1');
    console.log('Successfully connected to PostgreSQL');

    // Create superadmin_db if it doesn't exist
    const dbExists = await tempPool.query(
      "SELECT 1 FROM pg_database WHERE datname = 'superadmin_db'"
    );

    if (dbExists.rows.length === 0) {
      await tempPool.query('CREATE DATABASE superadmin_db');
      console.log('Created superadmin_db database');
    }

    // Check if tables exist in superadmin_db
    const tablesExist = await mainPool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'superadmins')
      )
    `);

    if (!tablesExist.rows[0].exists) {
      // Create tables only if they don't exist
      await mainPool.query(`
        CREATE TABLE IF NOT EXISTS superadmins (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          mobile_no VARCHAR(20) NOT NULL,
          address TEXT NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          organization VARCHAR(255) NOT NULL,
          username VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await mainPool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          first_name VARCHAR(255) NOT NULL,
          last_name VARCHAR(255) NOT NULL,
          username VARCHAR(255) UNIQUE NOT NULL,
          organization VARCHAR(255) NOT NULL,
          password VARCHAR(255) NOT NULL,
          branch VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log('Created tables in superadmin_db');
    } else {
      console.log('Tables already exist in superadmin_db');
    }

  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  } finally {
    if (tempPool) await tempPool.end();
  }
};

// Initialize database on startup
initializeDatabase();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/databases', databasesRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log("Connecting with user:", process.env.DB_USER);
  console.log("Database host:", process.env.DB_HOST);
  console.log("Database port:", process.env.DB_PORT);
});

module.exports = mainPool; 