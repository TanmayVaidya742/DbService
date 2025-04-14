// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];


  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ message: 'Missing token' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key', (err, decoded) => {
    if (err) {
      console.log('Token verification failed:', err.message);
      return res.status(403).json({ 
        message: 'Invalid token',
        error: err.message
      });
    }
    
    
    // Handle both superadmin (id) and regular users (user_id)
    if (!decoded.id && !decoded.user_id) {
      console.log('Token missing user identification');
      return res.status(403).json({ message: 'Token missing user information' });
    }
    
    // Standardize the user identifier
    req.user = {
      ...decoded,
      user_id: decoded.user_id || decoded.id // Use whichever exists
    };
    
    next();
  });
}

module.exports = { verifyToken };