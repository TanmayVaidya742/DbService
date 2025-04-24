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
// Register Superadmin - Updated to remove username
router.post('/register', async (req, res) => {
  const { name, mobile_no, address, email, organization, password } = req.body;

  try {
    if (!name || !mobile_no || !address || !email || !organization || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const emailCheck = await pool.query(
      'SELECT * FROM superadmins WHERE email = $1',
      [email]
    );
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO superadmins 
       (name, mobile_no, address, email, organization, password) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, name, email, organization, mobile_no`,
      [name, mobile_no, address, email, organization, hashedPassword]
    );

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
        organization: result.rows[0].organization,
        mobile_no: result.rows[0].mobile_no,
        user_type: 'superadmin'
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Error during registration' });
  }
});

// Login - Updated to only use email
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // First check in superadmins table
    let user = await pool.query(
      'SELECT * FROM superadmins WHERE email = $1',
      [email]
    );

    let isSuperadmin = true;
    
    // If not found in superadmins, check in users table
    if (user.rows.length === 0) {
      user = await pool.query(
        'SELECT * FROM users WHERE owner_email = $1',
        [email]
      );
      isSuperadmin = false;
    }

    if (user.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create token
    const tokenPayload = {
      user_id: isSuperadmin ? user.rows[0].id : user.rows[0].user_id,
      email: isSuperadmin ? user.rows[0].email : user.rows[0].owner_email,
      user_type: isSuperadmin ? 'superadmin' : 'user'
    };

    const token = jwt.sign(
      tokenPayload, 
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '24h' }
    );

    // Prepare response
    const responseData = isSuperadmin ? {
      token,
      user: {
        id: user.rows[0].id,
        name: user.rows[0].name,
        email: user.rows[0].email,
        organization: user.rows[0].organization,
        mobile_no: user.rows[0].mobile_no,
        user_type: 'superadmin'
      }
    } : {
      token,
      user: {
        user_id: user.rows[0].user_id,
        full_name: user.rows[0].full_name,
        organization_name: user.rows[0].organization_name,
        domain_name: user.rows[0].domain_name,
        owner_email: user.rows[0].owner_email,
        user_type: 'user'
      }
    };

    res.json(responseData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
