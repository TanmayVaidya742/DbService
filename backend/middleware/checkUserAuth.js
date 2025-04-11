const pool = require('../db'); // ⬅️ NOT from server.js

module.exports = async function checkUserAuth(req, res, next) {
  const apiKey = req.header('x-api-key');

  if (!apiKey) {
    return res.status(401).json({ message: 'API key missing' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE user_id = $1', [apiKey]);

    if (result.rows.length === 0) {
      return res.status(403).json({ message: 'Invalid API key' });
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    console.error('Error authenticating user:', err);
    res.status(500).json({ message: 'Authentication failed' });
  }
};
