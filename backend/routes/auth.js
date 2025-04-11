// const express = require('express');
// const router = express.Router();
// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');
// const pool = require('../config/db');

// // Check if any superadmin exists
// router.get('/check-users', async (req, res) => {
//   try {
//     const result = await pool.query('SELECT COUNT(*) FROM superadmins');
//     const hasUsers = result.rows[0].count > 0;
//     res.json({ hasUsers });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Register Superadmin
// router.post('/register', async (req, res) => {
//   const { name, mobile_no, address, email, organization, username, password } = req.body;

//   try {
//     // Validate required fields
//     if (!name || !mobile_no || !address || !email || !organization || !username || !password) {
//       return res.status(400).json({ message: 'All fields are required' });
//     }

//     // Check if email already exists
//     const emailCheck = await pool.query(
//       'SELECT * FROM superadmins WHERE email = $1',
//       [email]
//     );

//     if (emailCheck.rows.length > 0) {
//       return res.status(400).json({ message: 'Email already exists' });
//     }

//     // Check if username already exists
//     const usernameCheck = await pool.query(
//       'SELECT * FROM superadmins WHERE username = $1',
//       [username]
//     );

//     if (usernameCheck.rows.length > 0) {
//       return res.status(400).json({ message: 'Username already exists' });
//     }

//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Insert into superadmins table
//     const result = await pool.query(
//       `INSERT INTO superadmins 
//        (name, mobile_no, address, email, organization, username, password) 
//        VALUES ($1, $2, $3, $4, $5, $6, $7) 
//        RETURNING id, name, email, username, organization, mobile_no`,
//       [name, mobile_no, address, email, organization, username, hashedPassword]
//     );

//     // Generate JWT token
//     const token = jwt.sign(
//       { id: result.rows[0].id },
//       process.env.JWT_SECRET || 'fallback-secret-key',
//       { expiresIn: '1d' }
//     );

//     res.status(201).json({
//       token,
//       user: {
//         id: result.rows[0].id,
//         name: result.rows[0].name,
//         email: result.rows[0].email,
//         username: result.rows[0].username,
//         organization: result.rows[0].organization,
//         mobile_no: result.rows[0].mobile_no
//       }
//     });
//   } catch (err) {
//     console.error('Registration error:', err);
//     res.status(500).json({ message: 'Error during registration' });
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
//         'SELECT * FROM users WHERE username = $1',
//         [username]
//       );
//       user = result.rows[0];
//     }

//     // Validate user and password
//     if (!user || !(await bcrypt.compare(password, user.password))) {
//       return res.status(401).json({ message: 'Invalid username or password' });
//     }

//     const token = jwt.sign(
//       {
//         id: user.id,
//         username: user.username,
//         user_type: user.user_type || 'superadmin',
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
//         mobile_no: user.mobile_no || null,
//         user_type: user.user_type || 'superadmin',
//       },
//     });

//   } catch (err) {
//     console.error('Login error:', err);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });




// module.exports = router; 



//----------------------------------------------------------------------------------------------------------------------------------------------------------

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
    if (!name || !mobile_no || !address || !email || !organization || !username || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const emailCheck = await pool.query(
      'SELECT * FROM superadmins WHERE email = $1',
      [email]
    );
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const usernameCheck = await pool.query(
      'SELECT * FROM superadmins WHERE username = $1',
      [username]
    );
    if (usernameCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO superadmins 
       (name, mobile_no, address, email, organization, username, password) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id, name, email, username, organization, mobile_no`,
      [name, mobile_no, address, email, organization, username, hashedPassword]
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

// 🔐 Login Route
// router.post('/login', async (req, res) => {
//   const { username, password, user_id } = req.body;

//   try {
//     // 🔹 Superadmin login using username/password
//     if (username && password) {
//       const result = await pool.query(
//         'SELECT * FROM superadmins WHERE username = $1',
//         [username]
//       );
//       const user = result.rows[0];

//       if (!user || !(await bcrypt.compare(password, user.password))) {
//         return res.status(401).json({ message: 'Invalid superadmin credentials' });
//       }

//       const token = jwt.sign(
//         {
//           id: user.id,
//           username: user.username,
//           user_type: 'superadmin',
//         },
//         process.env.JWT_SECRET || 'your_jwt_secret',
//         { expiresIn: '24h' }
//       );

//       return res.json({
//         token,
//         user: {
//           id: user.id,
//           username: user.username,
//           name: user.name,
//           email: user.email,
//           organization: user.organization,
//           mobile_no: user.mobile_no,
//           user_type: 'superadmin',
//         },
//       });
//     }

//     // 🔸 Regular user login via user_id (UUID as API key)
//     if (user_id) {
//       const result = await pool.query('SELECT * FROM users WHERE user_id = $1', [user_id]);
//       const user = result.rows[0];

//       if (!user) {
//         return res.status(401).json({ message: 'Invalid API key' });
//       }

//       return res.json({
//         message: 'User authenticated successfully',
//         user: {
//           id: user.id,
//           user_id: user.user_id,
//           name: user.name,
//           username: user.username,
//           email: user.email,
//           organization: user.organization,
//           user_type: user.user_type,
//         },
//       });
//     }

//     return res.status(400).json({ message: 'Invalid login input' });
//   } catch (err) {
//     console.error('Login error:', err);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });
router.post('/login', async (req, res) => {
  const { username, password, user_id } = req.body;

  try {
    let user;

    // Superadmin login with username & password
    if (username && password) {
      const result = await pool.query(
        'SELECT * FROM superadmins WHERE username = $1',
        [username]
      );
      user = result.rows[0];

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }

      return res.json({
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          organization: user.organization,
          mobile_no: user.mobile_no,
          user_type: 'superadmin',
        },
      });
    }

    // User login with UUID as API key
    if (user_id) {
      const result = await pool.query('SELECT * FROM users WHERE user_id = $1', [user_id]);
      user = result.rows[0];

      if (!user) {
        return res.status(401).json({ message: 'Invalid user ID' });
      }

      return res.json({
        user: {
          id: user.id,
          user_id: user.user_id,
          username: user.username,
          name: user.name,
          email: user.email,
          organization: user.organization,
          user_type: user.user_type || 'user',
        },
      });
    }

    return res.status(400).json({ message: 'Missing credentials' });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


module.exports = router;
