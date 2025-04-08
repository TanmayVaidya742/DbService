const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
require('dotenv').config();

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

// Create a new user
router.post('/', async (req, res) => {
  const { organization, userType, email, name } = req.body;
  
  if (!organization || !userType || !email || !name) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Generate username and password based on organization
  const username = `${organization.toLowerCase().replace(/[^a-z0-9]/g, '')}@${organization.split('.').pop()}`;
  const password = `${organization.toLowerCase().replace(/[^a-z0-9]/g, '')}@123`;

  try {
    // Check if user already exists
    const userCheck = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Insert new user
    const result = await pool.query(
      `INSERT INTO users (first_name, last_name, username, organization, password, branch, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [
        name.split(' ')[0], // first_name
        name.split(' ').slice(1).join(' '), // last_name
        username,
        organization,
        password,
        organization.split('.').pop() // branch (using domain as branch)
      ]
    );

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: result.rows[0].id,
        username: result.rows[0].username,
        name: `${result.rows[0].first_name} ${result.rows[0].last_name}`,
        organization: result.rows[0].organization,
        branch: result.rows[0].branch
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

module.exports = router; 