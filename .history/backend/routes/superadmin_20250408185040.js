const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// Get superadmin data
router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching superadmin data for user:', req.user);
    const result = await pool.query(
      'SELECT id, name, email, organization, username FROM superadmins WHERE username = $1',
      [req.user.username]
    );

    if (result.rows.length === 0) {
      console.log('No superadmin found for username:', req.user.username);
      return res.status(404).json({ message: 'Superadmin not found' });
    }

    console.log('Superadmin data found:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching superadmin data:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 