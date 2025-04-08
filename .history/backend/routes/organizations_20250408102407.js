const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// POST /api/organizations
router.post('/', async (req, res) => {
  const { organization_name } = req.body;

  try {
    // Check if organization already exists
    const orgCheck = await pool.query(
      'SELECT * FROM organizations WHERE organization_name = $1',
      [organization_name]
    );

    if (orgCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Organization already exists' });
    }

    // Fetch the superadmin who owns the organization
    const superadmin = await pool.query(
      'SELECT name, organization FROM superadmins WHERE organization = $1',
      [organization_name]
    );

    if (superadmin.rows.length === 0) {
      return res.status(404).json({ message: 'Superadmin for this organization not found' });
    }

    const { name: owner_name, organization: domain } = superadmin.rows[0];

    // Insert into organizations table
    const newOrg = await pool.query(
      `INSERT INTO organizations (organization_name, owner_name, domain)
       VALUES ($1, $2, $3) RETURNING *`,
      [organization_name, owner_name, domain]
    );

    res.status(201).json({ organization: newOrg.rows[0] });
  } catch (err) {
    console.error('Error creating organization:', err);
    res.status(500).json({ message: 'Server error' });
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
