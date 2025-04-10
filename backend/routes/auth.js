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
  const { name, mobile_no, address, email, organization, username, password } = req.body;

  try {
    // Validate required fields
    if (!name || !mobile_no || !address || !email || !organization || !username || !password) {
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

    // Check if username already exists
    const usernameCheck = await pool.query(
      'SELECT * FROM superadmins WHERE username = $1',
      [username]
    );

    if (usernameCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into superadmins table
    const result = await pool.query(
      `INSERT INTO superadmins 
       (name, mobile_no, address, email, organization, username, password) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id, name, email, username, organization, mobile_no`,
      [name, mobile_no, address, email, organization, username, hashedPassword]
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
        name: result.rows[0].name,
        email: result.rows[0].email,
        username: result.rows[0].username,
        organization: result.rows[0].organization,
        mobile_no: result.rows[0].mobile_no
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Error during registration' });
  }
});

// Login Superadmin
// router.post('/login', async (req, res) => {
//   try {
//     const { username, password } = req.body;
//     console.log('Login attempt for username:', username);

//     // Check if username and password are provided
//     if (!username || !password) {
//       console.log('Missing username or password');
//       return res.status(400).json({ message: 'Username and password are required' });
//     }

//     // Find user by username in superadmins table
//     console.log('Executing database query for username:', username);
//     const user = await pool.query('SELECT * FROM superadmins WHERE username = $1', [username]);
//     console.log('Query result:', user.rows);
//     console.log('User found:', user.rows[0] ? 'Yes' : 'No');

//     if (user.rows.length === 0) {
//       console.log('User not found in database');
//       return res.status(401).json({ message: 'Invalid username or password' });
//     }

//     // Verify password
//     console.log('Comparing password for user:', user.rows[0].username);
//     const validPassword = await bcrypt.compare(password, user.rows[0].password);
//     console.log('Password valid:', validPassword);

//     if (!validPassword) {
//       console.log('Invalid password for user:', user.rows[0].username);
//       return res.status(401).json({ message: 'Invalid username or password' });
//     }

//     // Generate JWT token
//     const token = jwt.sign(
//       { id: user.rows[0].id, username: user.rows[0].username },
//       process.env.JWT_SECRET || 'fallback-secret-key',
//       { expiresIn: '1d' }
//     );

//     console.log('Login successful for username:', username);
//     res.json({
//       token,
//       user: {
//         id: user.rows[0].id,
//         name: user.rows[0].name,
//         email: user.rows[0].email,
//         username: user.rows[0].username,
//         organization: user.rows[0].organization,
//         mobile_no: user.rows[0].mobile_no
//       }
//     });
//   } catch (err) {
//     console.error('Login error:', err);
//     console.error('Error details:', {
//       message: err.message,
//       stack: err.stack,
//       code: err.code
//     });
//     res.status(500).json({ message: 'Server error during login' });
//   }
// });

// POST /api/auth/login
// router.post('/login', async (req, res) => {
//   const { username, password } = req.body;

//   try {
//     if (!username || !password) {
//       return res.status(400).json({ message: 'Username and password are required' });
//     }

//     let user = null;
//     let userType = null;

//     // Step 1: Check superadmin table
//     const superadminResult = await pool.query('SELECT * FROM superadmins WHERE username = $1', [username]);
//     if (superadminResult.rows.length > 0) {
//       user = superadminResult.rows[0];
//       userType = 'superadmin';
//     } else {
//       // Step 2: Check users table
//       const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
//       if (userResult.rows.length > 0) {
//         user = userResult.rows[0];
//         userType = 'user';
//       }
//     }

//     // Step 3: If user not found in either
//     if (!user) {
//       return res.status(401).json({ message: 'Invalid username or password' });
//     }

//     // Step 4: Check password
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(401).json({ message: 'Invalid username or password' });
//     }

//     // Step 5: Generate JWT
//     const token = jwt.sign(
//       { id: user.id, username: user.username, user_type: userType },
//       process.env.JWT_SECRET || 'fallback-secret-key',
//       { expiresIn: '1d' }
//     );

//     // Step 6: Return user info
//     res.json({
//       token,
//       user: {
//         id: user.id,
//         name: user.name,
//         email: user.email,
//         username: user.username,
//         organization: user.organization,
//         mobile_no: user.mobile_no,
//         user_type: userType,
//       },
//     });

//   } catch (err) {
//     console.error('Login error:', err);
//     res.status(500).json({ message: 'Server error during login' });
//   }
// });
// router.post('/login', async (req, res) => {
//   const { username, password } = req.body;

//   try {
//     // First, check in superadmins table
//     let result = await pool.query(
//       'SELECT * FROM superadmins WHERE username = $1',
//       [username]
//     );

//     let user = result.rows[0];

//     // If not found in superadmins, check in users table with user_type = 'user'
//     if (!user) {
//       result = await pool.query(
//         'SELECT * FROM users WHERE username = $1 AND user_type = $2',
//         [username, 'user']
//       );
//       user = result.rows[0];
//     }

//     // If still not found or password mismatch
//     if (!user || user.password !== password) {
//       return res.status(401).json({ message: 'Invalid username or password' });
//     }

//     // Generate JWT token
//     const token = jwt.sign(
//       {
//         id: user.id,
//         username: user.username,
//         user_type: user.user_type,
//       },
//       'your_jwt_secret',
//       { expiresIn: '24h' }
//     );

//     return res.json({ token, user });

//   } catch (err) {
//     console.error('Login error:', err);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });

// router.post('/login', async (req, res) => {
//   const { username, password } = req.body;

//   try {
//     let result = await pool.query(
//       'SELECT * FROM superadmins WHERE username = $1',
//       [username]
//     );
//     let user = result.rows[0];

//     if (!user) {
//       result = await pool.query(
//         'SELECT * FROM users WHERE username = $1 AND user_type = $2',
//         [username, 'user']
//       );
//       user = result.rows[0];
//     }

//     // Properly compare hashed password
//     if (!user || !(await bcrypt.compare(password, user.password))) {
//       return res.status(401).json({ message: 'Invalid username or password' });
//     }

//     const token = jwt.sign(
//       {
//         id: user.id,
//         username: user.username,
//         user_type: user.user_type || 'superadmin', // fallback for superadmin
//       },
//       process.env.JWT_SECRET || 'your_jwt_secret',
//       { expiresIn: '24h' }
//     );

//     return res.json({
//       token,
//       user: {
//         id: user.id,
//         username: user.username,
//         name: user.name,
//         email: user.email,
//         organization: user.organization,
//         mobile_no: user.mobile_no,
//         user_type: user.user_type || 'superadmin',
//       },
//     });

//   } catch (err) {
//     console.error('Login error:', err);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    let result = await pool.query(
      'SELECT * FROM superadmins WHERE username = $1',
      [username]
    );
    let user = result.rows[0];

    if (!user) {
      result = await pool.query(
        'SELECT * FROM users WHERE username = $1',
        [username]
      );
      user = result.rows[0];
    }

    // Validate user and password
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        user_type: user.user_type || 'superadmin',
      },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '24h' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        organization: user.organization,
        mobile_no: user.mobile_no || null,
        user_type: user.user_type || 'superadmin',
      },
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});




module.exports = router; 