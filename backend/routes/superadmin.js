const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

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
      username: superadmin.username
    });
  } catch (err) {
    console.error('Error fetching superadmin data:', err.stack);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;