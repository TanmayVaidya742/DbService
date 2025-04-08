const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
require('dotenv').config();

// Create a new organization
router.post('/', async (req, res) => {
  const { organizationName, ownerName, domain } = req.body;
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
  });

  try {
    // Check if organization already exists
    const checkResult = await pool.query(
      'SELECT * FROM organizations WHERE organization_name = $1',
      [organizationName]
    );

    if (checkResult.rows.length > 0) {
      return res.status(400).json({
        error: 'Organization already exists',
        message: 'An organization with this name already exists'
      });
    }

    // Insert new organization
    const result = await pool.query(
      'INSERT INTO organizations (organization_name, owner_name, domain) VALUES ($1, $2, $3) RETURNING *',
      [organizationName, ownerName, domain]
    );

    res.status(201).json({
      message: 'Organization created successfully',
      organization: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating organization:', error);
    res.status(500).json({
      error: 'Failed to create organization',
      message: error.message
    });
  } finally {
    await pool.end();
  }
});

// Get all organizations
router.get('/', async (req, res) => {
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
  });

  try {
    const result = await pool.query('SELECT * FROM organizations ORDER BY organization_name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({
      error: 'Failed to fetch organizations',
      message: error.message
    });
  } finally {
    await pool.end();
  }
});

// GET /api/organizations/domains
router.get('/domains', async (req, res) => {
    try {
      const result = await pool.query('SELECT DISTINCT organization FROM superadmins');
      const domains = result.rows.map(row => row.organization);
      res.json({ domains });
    } catch (err) {
      console.error('Error fetching domains:', err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  router.post('/with-users', async (req, res) => {
    const { organization_name, users } = req.body;
  
    const client = await pool.connect();
  
    try {
      await client.query('BEGIN');
  
      // 1. Check if organization already exists
      const orgCheck = await client.query(
        'SELECT * FROM organizations WHERE organization_name = $1',
        [organization_name]
      );
  
      let org;
  
      if (orgCheck.rows.length === 0) {
        // 2. Fetch superadmin info
        const superadmin = await client.query(
          'SELECT name FROM superadmins WHERE organization = $1',
          [organization_name]
        );
  
        if (superadmin.rows.length === 0) {
          return res.status(404).json({ message: 'Superadmin for this organization not found' });
        }
  
        const owner_name = superadmin.rows[0].name;
        const domain = `@${organization_name}.in`;
  
        // 3. Create new organization
        const newOrg = await client.query(
          `INSERT INTO organizations (organization_name, owner_name, domain)
           VALUES ($1, $2, $3) RETURNING *`,
          [organization_name, owner_name, domain]
        );
  
        org = newOrg.rows[0];
      } else {
        org = orgCheck.rows[0];
      }
  
      // 4. Insert all users
    //   for (const user of users) {
    //     const { first_name, last_name, username, password, branch } = user;
  
    //     await client.query(
    //       `INSERT INTO users (first_name, last_name, username, organization, password, branch)
    //        VALUES ($1, $2, $3, $4, $5, $6)`,
    //       [first_name, last_name, username, organization_name, password, branch]
    //     );
    //   }
    let addedUsers = [];
    let skippedUsers = [];
    
    for (const user of users) {
      const { first_name, last_name, username, password, branch } = user;
    
      // Check for existing username
      const userCheck = await client.query(
        'SELECT * FROM users WHERE username = $1',
        [username]
      );
    
      if (userCheck.rows.length > 0) {
        skippedUsers.push({ username, reason: 'Username already exists' });
        continue;
      }
    
      await client.query(
        `INSERT INTO users (first_name, last_name, username, organization, password, branch)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [first_name, last_name, username, organization_name, password, branch]
      );
    
      addedUsers.push(username);
    }
    
      
  
      await client.query('COMMIT');
  
    //   res.status(201).json({
    //     organization: org,
    //     message: `${users.length} user(s) added under ${organization_name}`
    //   });

    res.status(201).json({
        organization: org,
        added: addedUsers.length,
        skipped: skippedUsers.length,
        skippedUsers,
        message: `${addedUsers.length} user(s) added, ${skippedUsers.length} skipped (duplicate usernames)`
      });
      
  
    } 
    
    catch (err) {
      await client.query('ROLLBACK');
      console.error('Error creating org & users:', err);
      res.status(500).json({ message: 'Server error' });
    } finally {
      client.release();
    }
  });
  
  

module.exports = router;
