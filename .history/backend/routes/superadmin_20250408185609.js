const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// Get superadmin data
router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching superadmin data for user:', req.user);
    
    // First try to find by username
    let result = await pool.query(
      'SELECT id, name, email, organization, username FROM superadmins WHERE username = $1',
      [req.user.username]
    );

    // If not found by username, try by id
    if (result.rows.length === 0) {
      result = await pool.query(
        'SELECT id, name, email, organization, username FROM superadmins WHERE id = $1',
        [req.user.id]
      );
    }

    if (result.rows.length === 0) {
      console.log('No superadmin found for:', req.user);
      return res.status(404).json({ message: 'Superadmin not found' });
    }

    const superadmin = result.rows[0];
    console.log('Superadmin data found:', superadmin);
    
    res.json({
      id: superadmin.id,
      name: superadmin.name,
      email: superadmin.email,
      organization: superadmin.organization,
      username: superadmin.username
    });
  } catch (err) {
    console.error('Error fetching superadmin data:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 