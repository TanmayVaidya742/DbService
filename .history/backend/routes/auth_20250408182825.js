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
  const { name, mobile_no, address, email, organization, username, password } = req.body;

  try {
    // Validate required fields
    if (!name || !mobile_no || !address || !email || !organization || !username || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if email already exists
    const emailCheck = await pool.query(
      'SELECT * FROM superadmins WHERE email = $1',
      [email]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Check if username already exists
    const usernameCheck = await pool.query(
      'SELECT * FROM superadmins WHERE username = $1',
      [username]
    );

    if (usernameCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into superadmins table
    const result = await pool.query(
      `INSERT INTO superadmins 
       (name, mobile_no, address, email, organization, username, password) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id, name, email, username, organization, mobile_no`,
      [name, mobile_no, address, email, organization, username, hashedPassword]
    );

    // Generate JWT token
    const token = jwt.sign(
      { id: result.rows[0].id },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '1d' }
    );

    res.status(201).json({
      token,
      user: {
        id: result.rows[0].id,
        name: result.rows[0].name,
        email: result.rows[0].email,
        username: result.rows[0].username,
        organization: result.rows[0].organization,
        mobile_no: result.rows[0].mobile_no
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Error during registration' });
  }
});

// Login Superadmin
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await pool.query(
      'SELECT * FROM superadmins WHERE email = $1',
      [email]
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
        organization_name: user.rows[0].organization_name,
        owner_name: user.rows[0].owner_name,
        domain: user.rows[0].domain,
        email: user.rows[0].email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

module.exports = router; 