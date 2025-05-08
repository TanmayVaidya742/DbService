const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { mainPool } = require('../config/db');
const nodemailer = require('nodemailer');

router.get('/check-users', async (req, res) => {
  try {
    const result = await mainPool.query('SELECT COUNT(*) FROM superadmins');
    const hasUsers = result.rows[0].count > 0;
    res.json({ hasUsers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/register', async (req, res) => {
  const { name, mobile_no, address, email, organization, password } = req.body;

  try {
    if (!name || !mobile_no || !address || !email || !organization || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const emailCheck = await mainPool.query(
      'SELECT * FROM superadmins WHERE email = $1',
      [email]
    );
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await mainPool.query(
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

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    let user = await mainPool.query(
      'SELECT * FROM superadmins WHERE email = $1',
      [email]
    );

    let isSuperadmin = true;
    
    if (user.rows.length === 0) {
      user = await mainPool.query(
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

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password', // Use an App Password for Gmail
  },
});

// Request an OTP for password reset
router.post('/request-reset', async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    let user = await mainPool.query(
      'SELECT * FROM superadmins WHERE email = $1',
      [email]
    );

    let isSuperadmin = true;

    if (user.rows.length === 0) {
      user = await mainPool.query(
        'SELECT * FROM users WHERE owner_email = $1',
        [email]
      );
      isSuperadmin = false;
    }

    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'Email not found' });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Store the OTP in the database
    await mainPool.query(
      `INSERT INTO password_reset_tokens (email, token, expires_at)
       VALUES ($1, $2, $3)`,
      [email, otp, expiresAt]
    );

    // Send the OTP via email
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: email,
      subject: 'Password Reset OTP',
      text: `Your OTP for password reset is: ${otp}. It is valid for 10 minutes.`,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: 'OTP sent to your email' });
  } catch (err) {
    console.error('Request reset error:', err);
    res.status(500).json({ message: 'Server error during reset request' });
  }
});

// Reset password with OTP
router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }

    // Verify the OTP
    const otpResult = await mainPool.query(
      `SELECT * FROM password_reset_tokens 
       WHERE email = $1 AND token = $2 AND expires_at > NOW() AND used = FALSE`,
      [email, otp]
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    let user = await mainPool.query(
      'SELECT * FROM superadmins WHERE email = $1',
      [email]
    );

    let isSuperadmin = true;
    let tableName = 'superadmins';

    if (user.rows.length === 0) {
      user = await mainPool.query(
        'SELECT * FROM users WHERE owner_email = $1',
        [email]
      );
      isSuperadmin = false;
      tableName = 'users';
    }

    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'Email not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await mainPool.query(
      `UPDATE ${tableName} SET password = $1 WHERE ${isSuperadmin ? 'email' : 'owner_email'} = $2`,
      [hashedPassword, email]
    );

    await mainPool.query(
      `UPDATE password_reset_tokens SET used = TRUE WHERE token = $1`,
      [otp]
    );

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Password reset error:', err);
    res.status(500).json({ message: 'Server error during password reset' });
  }
});




router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    // Verify token with same secret used in login
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');

    // Determine user type from token
    const isSuperadmin = decoded.user_type === 'superadmin';
    
    // Query appropriate table
    const result = await mainPool.query(
      `SELECT ${isSuperadmin ? 'email' : 'owner_email AS email'} 
       FROM ${isSuperadmin ? 'superadmins' : 'users'}
       WHERE ${isSuperadmin ? 'id' : 'user_id'} = $1`,
      [decoded.user_id || decoded.id] // Handle both user types
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ 
      email: result.rows[0].email,
      // Add other fields if needed
    });
  } catch (err) {
    console.error("Auth me endpoint error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;