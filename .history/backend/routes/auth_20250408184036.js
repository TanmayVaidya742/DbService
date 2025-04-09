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
    const { username, password } = req.body;
    console.log('Login attempt for username:', username);

    // Check if username and password are provided
    if (!username || !password) {
      console.log('Missing username or password');
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Find user by username
    const user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    console.log('User found:', user.rows[0] ? 'Yes' : 'No');

    if (user.rows.length === 0) {
      console.log('User not found');
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    console.log('Password valid:', validPassword);

    if (!validPassword) {
      console.log('Invalid password');
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.rows[0].id, username: user.rows[0].username },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    console.log('Login successful for username:', username);
    res.json({
      token,
      user: {
        id: user.rows[0].id,
        username: user.rows[0].username,
        full_name: user.rows[0].full_name,
        user_type: user.rows[0].user_type,
        organization_id: user.rows[0].organization_id
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

module.exports = router; 