const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Initialize organizations table
const initializeOrganizationsTable = async () => {
  try {
    const client = await pool.connect();
    try {
      // Check if organizations table exists
      const checkTableQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'organizations'
        );
      `;
      const tableExists = await client.query(checkTableQuery);
      
      if (!tableExists.rows[0].exists) {
        // Create organizations table if it doesn't exist
        const createTableQuery = `
          CREATE TABLE organizations (
            id SERIAL PRIMARY KEY,
            organization_name VARCHAR(255) NOT NULL UNIQUE,
            owner_name VARCHAR(255) NOT NULL,
            domain VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `;
        await client.query(createTableQuery);
        console.log('Organizations table created successfully');
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error initializing organizations table:', error);
  }
};

// Initialize table when the server starts
initializeOrganizationsTable();

// Get all organizations
router.get('/', async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query('SELECT * FROM organizations ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({ message: 'Error fetching organizations' });
  } finally {
    if (client) client.release();
  }
});

// Create a new organization
router.post('/', async (req, res) => {
  const { organizationName, ownerName, domain } = req.body;
  let client;
  
  try {
    client = await pool.connect();
    
    // Check if organization already exists
    const checkQuery = 'SELECT * FROM organizations WHERE organization_name = $1';
    const checkResult = await client.query(checkQuery, [organizationName]);
    
    if (checkResult.rows.length > 0) {
      return res.status(400).json({ message: 'Organization already exists' });
    }
    
    // Insert new organization
    const insertQuery = `
      INSERT INTO organizations (organization_name, owner_name, domain)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const result = await client.query(insertQuery, [organizationName, ownerName, domain]);
    
    res.status(201).json({
      message: 'Organization created successfully',
      organization: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating organization:', error);
    res.status(500).json({ message: 'Error creating organization' });
  } finally {
    if (client) client.release();
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
