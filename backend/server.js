const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
<<<<<<< Updated upstream
require('dotenv').config();
=======
const organizationsRoutes = require('./routes/organizations');
>>>>>>> Stashed changes

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
const initializeDatabase = async () => {
  try {
    // Drop existing tables if they exist
    await pool.query(`
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS superadmins CASCADE;
    `);

    // Create superadmins table
    await pool.query(`
      CREATE TABLE superadmins (
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

    // Create users table
    await pool.query(`
      CREATE TABLE users (
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

    // Create organizations table
await pool.query(`
  CREATE TABLE organizations (
    id SERIAL PRIMARY KEY,
    organization_name VARCHAR(255) UNIQUE NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) NOT NULL, -- this will hold the organization field from superadmins
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);


    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
};


// const initializeDatabase = async () => {
//   try {
//     // Drop existing tables if they exist
//     await pool.query(`
//       DROP TABLE IF EXISTS users CASCADE;
//       DROP TABLE IF EXISTS superadmins CASCADE;
//       DROP TABLE IF EXISTS organizations CASCADE;
//     `);

//     // Create superadmins table
//     await pool.query(`
//       CREATE TABLE superadmins (
//         id SERIAL PRIMARY KEY,
//         name VARCHAR(255) NOT NULL,
//         mobile_no VARCHAR(20) NOT NULL,
//         address TEXT NOT NULL,
//         email VARCHAR(255) UNIQUE NOT NULL,
//         organization VARCHAR(255) NOT NULL,
//         username VARCHAR(255) UNIQUE NOT NULL,
//         password VARCHAR(255) NOT NULL,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       )
//     `);

//     // Create users table
//     await pool.query(`
//       CREATE TABLE users (
//         id SERIAL PRIMARY KEY,
//         first_name VARCHAR(255) NOT NULL,
//         last_name VARCHAR(255) NOT NULL,
//         username VARCHAR(255) UNIQUE NOT NULL,
//         organization VARCHAR(255) NOT NULL,
//         password VARCHAR(255) NOT NULL,
//         branch VARCHAR(255) NOT NULL,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       )
//     `);

//     // Create organizations table
//     await pool.query(`
//       CREATE TABLE organizations (
//         id SERIAL PRIMARY KEY,
//         organization_name VARCHAR(255) UNIQUE NOT NULL,
//         owner_name VARCHAR(255) NOT NULL,
//         domain VARCHAR(255) NOT NULL,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       )
//     `);

//     console.log('Database initialized successfully');
//   } catch (err) {
//     console.error('Error initializing database:', err);
//   }
// };


// Initialize database on startup
initializeDatabase();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/organizations', organizationsRoutes);



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log("Connecting with user:", process.env.DB_USER);
  console.log("Password is:", process.env.DB_PASSWORD);

});

module.exports = pool; 