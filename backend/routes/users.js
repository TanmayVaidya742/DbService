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

  // Generate unique username and password based on organization
  const timestamp = Date.now().toString().slice(-4); // Get last 4 digits of timestamp
  const username = `${organization.toLowerCase().replace(/[^a-z0-9]/g, '')}${timestamp}@${organization.split('.').pop()}`;
  const password = `${organization.toLowerCase().replace(/[^a-z0-9]/g, '')}@123`;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if organization exists
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

    // Insert new user
    const result = await client.query(
      `INSERT INTO users (first_name, last_name, username, email, organization, password, branch, user_type, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING *`,
      [
        name.split(' ')[0], // first_name
        name.split(' ').slice(1).join(' '), // last_name
        username,
        email,
        organization,
        password,
        organization.split('.').pop(), // branch
        userType
      ]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: result.rows[0].id,
        username: result.rows[0].username,
        email: result.rows[0].email,
        name: `${result.rows[0].first_name} ${result.rows[0].last_name}`,
        organization: result.rows[0].organization,
        branch: result.rows[0].branch,
        userType: result.rows[0].user_type
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating user:', error);
    res.status(500).json({ 
      message: 'Error creating user',
      error: error.message,
      detail: error.detail
    });
  } finally {
    client.release();
  }
});

module.exports = router; 