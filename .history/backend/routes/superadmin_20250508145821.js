const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken'); // Add this line
const { mainPool } = require('../config/db'); // Import mainPool instead of pool


// Get superadmin data
router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching superadmin data for user:', req.user);

    // Validate req.user
    if (!req.user || !req.user.user_id) {
      console.log('Invalid req.user:', req.user);
      return res.status(401).json({ message: 'Unauthorized: Invalid user data' });
    }

    // Query by user_id (which maps to the id column in superadmins table)
    const result = await pool.query(
      'SELECT id, name, email, organization, username FROM superadmins WHERE id = $1',
      [req.user.user_id]
    );

    if (result.rows.length === 0) {
      console.log('No superadmin found for user_id:', req.user.user_id);
      return res.status(404).json({ message: 'Superadmin not found' });
    }

    const superadmin = result.rows[0];
    console.log('Superadmin data found:', superadmin);

    res.json({
      id: superadmin.id,
      name: superadmin.name,
      email: superadmin.email,
      organization: superadmin.organization,
    });
  } catch (err) {
    console.error('Error fetching superadmin data:', err.stack);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/me', async (req, res) => {
  try {
    // Extract token from Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');

    // Log decoded token for debugging
    console.log('Decoded token:', decoded);

    // Check if user is superadmin
    const isSuperadmin = decoded.user_type === 'superadmin';
    const userId = decoded.user_id || decoded.id; // Handle both user_id and id

    if (!userId) {
      return res.status(400).json({ error: 'Invalid token: Missing user ID' });
    }

    // Query the appropriate table
    const queryText = isSuperadmin
      ? 'SELECT id, email, name, organization FROM superadmins WHERE id = $1'
      : 'SELECT user_id AS id, owner_email AS email, full_name AS name FROM users WHERE user_id = $1';
    
    const result = await mainPool.query(queryText, [userId]);

    if (result.rows.length === 0) {
      console.log('No user found for ID:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    console.log('User data found:', user);

    // Return consistent response
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      organization: user.organization || null, // Only for superadmins
    });
  } catch (err) {
    console.error('Auth /me endpoint error:', err);
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 