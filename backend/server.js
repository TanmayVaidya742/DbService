const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const csv = require('csv-parser');
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const organizationsRoutes = require('./routes/organizations');
const databasesRoutes = require('./routes/databases');
const superadminRoutes = require('./routes/superadmin');
const accessRoutes = require('./routes/access'); // ✅ Add this route
const databaseApiRoutes = require('./routes/databaseAPI');

const app = express();

// Load environment variables
dotenv.config();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// Database configuration
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
};

console.log('Connecting with user:', dbConfig.user);
console.log('Database host:', dbConfig.host);
console.log('Database port:', dbConfig.port);

// Function to create database if it doesn't exist
const createDatabase = async () => {
  // Connect to default postgres database
  const defaultPool = new Pool({
    ...dbConfig,
    database: 'postgres'
  });

  try {
    // Check if database exists
    const result = await defaultPool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbConfig.database]
    );

    if (result.rows.length === 0) {
      // Create database if it doesn't exist
      await defaultPool.query(`CREATE DATABASE ${dbConfig.database}`);
      console.log(`Database ${dbConfig.database} created successfully`);
    } else {
      console.log(`Database ${dbConfig.database} already exists`);
    }
  } catch (err) {
    console.error('Error creating database:', err);
  } finally {
    await defaultPool.end();
  }
};

// Create main connection pool
const mainPool = new Pool(dbConfig);

// Test connection
mainPool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to PostgreSQL:', err);
    return;
  }
  console.log('Connected to PostgreSQL successfully');
  release();
});

// // Initialize database
// const initializeDatabase = async () => {
//   try {
//     // First create the database if it doesn't exist
//     await createDatabase();

//     // Create superadmins table if not exists
//     await mainPool.query(`
//       CREATE TABLE IF NOT EXISTS superadmins (
//         id SERIAL PRIMARY KEY,
//         name VARCHAR(255) NOT NULL,
//         mobile_no VARCHAR(20) NOT NULL,
//         address TEXT NOT NULL,
//         email VARCHAR(255) NOT NULL UNIQUE,
//         organization VARCHAR(255) NOT NULL,
//         username VARCHAR(255) NOT NULL UNIQUE,
//         password VARCHAR(255) NOT NULL,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       )
//     `);

//     // Create users table if not exists
//     await mainPool.query(`
//         CREATE TABLE IF NOT EXISTS users (
//         id SERIAL PRIMARY KEY,
//         name VARCHAR(255) NOT NULL,
//         username VARCHAR(255) NOT NULL UNIQUE,
//         email VARCHAR(255) NOT NULL UNIQUE,
//         password VARCHAR(255) NOT NULL,
//         organization VARCHAR(255) NOT NULL,
//         user_type VARCHAR(50) NOT NULL,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       );
//     `);

//     // ✅ Create organizations table if not exists
//     await mainPool.query(`
//       CREATE TABLE IF NOT EXISTS organizations (
//         id SERIAL PRIMARY KEY,
//         organization_name VARCHAR(255) NOT NULL UNIQUE,
//         owner_name VARCHAR(255) NOT NULL,
//         domain VARCHAR(255) NOT NULL,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       )
//     `);

//     console.log('Database tables initialized successfully');
//   } catch (err) {
//     console.error('Error initializing database:', err);
//   }
// };
// Initialize database
const initializeDatabase = async () => {
  try {
    // First create the database if it doesn't exist
    await createDatabase();

    // Enable uuid-ossp extension
    await mainPool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    // Create superadmins table if not exists
    await mainPool.query(`
      CREATE TABLE IF NOT EXISTS superadmins (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        mobile_no VARCHAR(20) NOT NULL,
        address TEXT NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        organization VARCHAR(255) NOT NULL,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create users table with UUID primary key
    await mainPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        organization VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create organizations table
    await mainPool.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id SERIAL PRIMARY KEY,
        organization_name VARCHAR(255) NOT NULL UNIQUE,
        owner_name VARCHAR(255) NOT NULL,
        domain VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database tables initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
};


// Initialize database
initializeDatabase();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/organizations', organizationsRoutes);
app.use('/api/databases', databasesRoutes);
app.use('/api/superadmin', superadminRoutes);

const { verifyToken } = require('./middleware/authMiddleware');
app.get('/api/protected', verifyToken, (req, res) => {
  res.json({ message: `Welcome, ${req.user.username}!` });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
});

// Export the mainPool for use in other files
module.exports = { mainPool }; 