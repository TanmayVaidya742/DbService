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
  
  console.log('Received user creation request:', { organization, userType, email, name });
  
  if (!organization || !userType || !email || !name) {
    console.log('Missing required fields:', { organization, userType, email, name });
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Generate unique username and password
  const timestamp = Date.now().toString().slice(-4);
  const username = `${organization.toLowerCase().replace(/[^a-z0-9]/g, '')}${timestamp}`;
  const password = `${organization.toLowerCase().replace(/[^a-z0-9]/g, '')}@123`;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if organization exists (if you're using organizations table)
    // If not, you can remove this check since you're using superadmin's organization
    const orgCheck = await client.query(
      'SELECT * FROM organizations WHERE organization_name = $1',
      [organization]
    );

    if (orgCheck.rows.length === 0) {
      console.log('Organization not found:', organization);
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Organization does not exist' });
    }

    // Check if user already exists with email
    const userCheck = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userCheck.rows.length > 0) {
      console.log('User already exists with email:', email);
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Insert new user with just the name field
    const result = await client.query(
      `INSERT INTO users (name, username, email, organization, password, user_type, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [
        name, // Just store the full name
        username,
        email,
        organization,
        password,
        userType
      ]
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