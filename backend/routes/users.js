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

// Create a new user with UUID and email domain validation
router.post('/', async (req, res) => {
  const { organization, email, name, username, password } = req.body;

  console.log('Received user creation request:', req.body);

  if (!organization || !email || !name || !username || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Validate email domain matches organization domain
  const emailParts = email.split('@');
  if (emailParts.length !== 2 || emailParts[1].toLowerCase() !== organization.toLowerCase()) {
    return res.status(400).json({ 
      message: `Email must be from the ${organization} domain` 
    });
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
      `INSERT INTO users (name, username, email, organization, password, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING user_id, name, username, email, organization, created_at`,
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

// Delete a user - Fixed to properly handle UUID format
router.delete('/:userId', async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  console.log('Attempting to delete user with ID:', userId);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if user exists
    const userCheck = await client.query(
      'SELECT * FROM users WHERE user_id::text = $1',
      [userId]
    );

    if (userCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete user
    await client.query(
      'DELETE FROM users WHERE user_id::text = $1',
      [userId]
    );

    await client.query('COMMIT');

    res.status(200).json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      message: 'Error deleting user',
      error: error.message
    });
  } finally {
    client.release();
  }
});

module.exports = router;