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
  const { organization_name, owner_name, domain, email, password } = req.body;

  try {
    // Validate required fields
    if (!organization_name || !owner_name || !domain || !email || !password) {
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

    // Check if organization name already exists
    const orgCheck = await pool.query(
      'SELECT * FROM superadmins WHERE organization_name = $1',
      [organization_name]
    );

    if (orgCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Organization name already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into superadmins table
    const result = await pool.query(
      `INSERT INTO superadmins 
       (organization_name, owner_name, domain, email, password) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, organization_name, owner_name, domain, email`,
      [organization_name, owner_name, domain, email, hashedPassword]
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
        organization_name: result.rows[0].organization_name,
        owner_name: result.rows[0].owner_name,
        domain: result.rows[0].domain,
        email: result.rows[0].email
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