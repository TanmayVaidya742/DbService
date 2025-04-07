const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcrypt');

// Get all users
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new user
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, username, organization, password, domain } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !username || !organization || !password || !domain) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if username already exists
    const userExists = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new user
    const result = await pool.query(
      'INSERT INTO users (first_name, last_name, username, organization, password, domain) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [firstName, lastName, username, organization, hashedPassword, domain]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 