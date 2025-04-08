const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Check if any superadmin exists
router.get('/check-users', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM superadmins');
    const hasUsers = result.rows[0].count > 0;
    res.json({ hasUsers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Register Superadmin
router.post('/register', async (req, res) => {
  try {
    const { name, mobile_no, address, email, organization, username, password } = req.body;

    // Validate required fields
    if (!name || !mobile_no || !address || !email || !organization || !username || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate mobile number (assuming 10 digits)
    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(mobile_no)) {
      return res.status(400).json({ message: 'Mobile number must be 10 digits' });
    }

    // Check if user already exists
    const userExists = await pool.query(
      'SELECT * FROM superadmins WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new superadmin
    const newUser = await pool.query(
      `INSERT INTO superadmins (
        name, mobile_no, address, email, organization, username, password
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, mobile_no, address, email, organization, username, hashedPassword]
    );


    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.rows[0].id },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '1d' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser.rows[0].id,
        name: newUser.rows[0].name,
        email: newUser.rows[0].email,
        username: newUser.rows[0].username,
        organization: newUser.rows[0].organization,
        mobile_no: newUser.rows[0].mobile_no
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Server error during registration',
      error: error.message 
    });
  }
});

// Login Superadmin
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user exists
    const user = await pool.query(
      'SELECT * FROM superadmins WHERE username = $1',
      [username]
    );

    if (user.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.rows[0].id },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user.rows[0].id,
        name: user.rows[0].name,
        username: user.rows[0].username,
        email: user.rows[0].email,
        organization: user.rows[0].organization,
        mobile_no: user.rows[0].mobile_no
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

module.exports = router; 