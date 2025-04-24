const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { verifyToken } = require('../middleware/authMiddleware');
const bcrypt = require('bcrypt');
require('dotenv').config();

const generateApiKey = () => {
  const buffer = require('crypto').randomBytes(32);
  return buffer.toString('hex');
};

// POST route to create a new organization
router.post('/', verifyToken, async (req, res) => {
  const { 
    organizationName, 
    domainName, 
    ownerEmail, 
    fullName, 
    password
  } = req.body;
  
  const userId = req.user.user_id;
  let client = null;

  try {
    // Validate required fields
    if (!organizationName || !domainName || !ownerEmail || !fullName || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domainName)) {
      return res.status(400).json({ error: 'Invalid domain name format' });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Validate email matches domain
    const emailDomain = ownerEmail.split('@')[1];
    if (emailDomain !== domainName) {
      return res.status(400).json({ error: 'Owner email domain must match organization domain' });
    }

    client = await req.mainPool.connect();
    await client.query('BEGIN');

    // Check if domain is already taken
    const domainCheck = await client.query(
      'SELECT 1 FROM organizations WHERE domain_name = $1',
      [domainName]
    );

    if (domainCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Domain name is already taken' });
    }

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Store organization information
    const orgResult = await client.query(
      `INSERT INTO organizations (
        name, 
        domain_name, 
        owner_email, 
        owner_name,
        password_hash
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id`,
      [organizationName, domainName, ownerEmail, fullName, passwordHash]
    );

    const orgId = orgResult.rows[0].id;

    // Generate API key for the organization
    const apiKey = generateApiKey();

    // Associate the organization with the user who created it
    await client.query(
      `INSERT INTO user_organizations (user_id, organization_id, api_key)
       VALUES ($1, $2, $3)`,
      [userId, orgId, apiKey]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Organization created successfully',
      apiKey: apiKey,
      organizationId: orgId
    });

  } catch (error) {
    console.error('Error creating organization:', error);
    
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }
    
    res.status(500).json({ error: error.message });
  } finally {
    if (client) client.release();
  }
});

module.exports = router;