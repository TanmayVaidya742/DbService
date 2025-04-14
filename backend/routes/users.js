// const express = require('express');
// const router = express.Router();
// const { Pool } = require('pg');
// require('dotenv').config();
// const jwt = require('jsonwebtoken');
// const bcrypt = require('bcrypt');

// const pool = new Pool({
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_NAME,
//   password: process.env.DB_PASSWORD,
//   port: process.env.DB_PORT,
// });

// // Get all users
// router.get('/', async (req, res) => {
//   try {
//     const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
//     res.json(result.rows);
//   } catch (error) {
//     console.error('Error fetching users:', error);
//     res.status(500).json({ message: 'Error fetching users' });
//   }
// });

// // Create a new user
// // router.post('/', async (req, res) => {
// //   const { organization, user_type, email, name, username, password } = req.body;
  
// //   console.log('Received user creation request:', req.body);
  
// //   if (!organization || !user_type || !email || !name || !username || !password) {
// //     return res.status(400).json({ message: 'All fields are required' });
// //   }

// //   const client = await pool.connect();
// //   try {
// //     await client.query('BEGIN');

// //     // Check if user exists with email or username
// //     const userCheck = await client.query(
// //       'SELECT * FROM users WHERE email = $1 OR username = $2',
// //       [email, username]
// //     );

// //     if (userCheck.rows.length > 0) {
// //       await client.query('ROLLBACK');
// //       return res.status(400).json({ message: 'User with this email or username already exists' });
// //     }

// //     // Insert new user
// //     const result = await client.query(
// //       `INSERT INTO users (name, username, email, organization, password, user_type, created_at)
// //        VALUES ($1, $2, $3, $4, $5, $6, NOW())
// //        RETURNING *`,
// //       [name, username, email, organization, password, user_type]
// //     );

// //     await client.query('COMMIT');

// //     res.status(201).json({
// //       message: 'User created successfully',
// //       user: result.rows[0]
// //     });
// //   } catch (error) {
// //     await client.query('ROLLBACK');
// //     console.error('Error creating user:', error);
// //     res.status(500).json({ 
// //       message: 'Error creating user',
// //       error: error.message
// //     });
// //   } finally {
// //     client.release();
// //   }
// // });
// // Create a new user
// router.post('/', async (req, res) => {
//   const { organization, user_type, email, name, username, password } = req.body;

//   console.log('Received user creation request:', req.body);

//   if (!organization || !user_type || !email || !name || !username || !password) {
//     return res.status(400).json({ message: 'All fields are required' });
//   }

//   const client = await pool.connect();
//   try {
//     await client.query('BEGIN');

//     // Check if user exists with email or username
//     const userCheck = await client.query(
//       'SELECT * FROM users WHERE email = $1 OR username = $2',
//       [email, username]
//     );

//     if (userCheck.rows.length > 0) {
//       await client.query('ROLLBACK');
//       return res.status(400).json({ message: 'User with this email or username already exists' });
//     }

//     // ✅ Hash the password before storing
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Insert new user with hashed password
//     const result = await client.query(
//       `INSERT INTO users (name, username, email, organization, password, user_type, created_at)
//        VALUES ($1, $2, $3, $4, $5, $6, NOW())
//        RETURNING *`,
//       [name, username, email, organization, hashedPassword, user_type]
//     );

//     await client.query('COMMIT');

//     res.status(201).json({
//       message: 'User created successfully',
//       user: result.rows[0]
//     });
//   } catch (error) {
//     await client.query('ROLLBACK');
//     console.error('Error creating user:', error);
//     res.status(500).json({ 
//       message: 'Error creating user',
//       error: error.message
//     });
//   } finally {
//     client.release();
//   }
// });


// module.exports = router; 

const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// DB connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Get all users
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Create a new user with UUID
router.post('/', async (req, res) => {
  const { organization, email, name, username, password } = req.body;

  console.log('Received user creation request:', req.body);

  if (!organization || !email || !name || !username || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if user already exists
    const userCheck = await client.query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (userCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user and return the created user
    const result = await client.query(
      `INSERT INTO users (name, username, email, organization, password,created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING user_id, name, username, email, organization,created_at`,
      [name, username, email, organization, hashedPassword]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'User created successfully',
      user: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating user:', error);
    res.status(500).json({ 
      message: 'Error creating user',
      error: error.message
    });
  } finally {
    client.release();
  }
});

module.exports = router;
