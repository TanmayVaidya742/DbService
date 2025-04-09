const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// Get superadmin data
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT id, name, email, organization, username FROM superadmins WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Superadmin not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching superadmin data:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 