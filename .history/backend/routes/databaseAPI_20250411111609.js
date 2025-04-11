const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
require('dotenv').config();

// Middleware to validate API key and get database connection
const validateApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key is required' });
  }

  try {
    // Connect to postgres to find which database this API key belongs to
    const tempPool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      port: process.env.DB_PORT || 5432,
    });

    // Check all databases for this API key
    const databases = await tempPool.query(`
      SELECT datname FROM pg_database 
      WHERE datistemplate = false AND datname NOT IN ('postgres')
    `);

    let dbConfig = null;
    
    // Search each database for the API key
    for (const db of databases.rows) {
      const dbPool = new Pool({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: db.datname,
        password: process.env.DB_PASSWORD || 'postgres',
        port: process.env.DB_PORT || 5432,
      });

      try {
        const result = await dbPool.query(
          'SELECT database_name, table_name FROM api_keys WHERE key = $1 LIMIT 1',
          [apiKey]
        );
        
        if (result.rows.length > 0) {
          dbConfig = {
            database: db.datname,
            table: result.rows[0].table_name,
            pool: dbPool
          };
          break;
        }
      } catch (err) {
        console.log(`Database ${db.datname} doesn't have api_keys table`);
      } finally {
        if (!dbConfig) await dbPool.end(); // Only end if we're not using this pool
      }
    }

    await tempPool.end();

    if (!dbConfig) {
      return res.status(403).json({ error: 'Invalid API key' });
    }

    // Attach database config to request for use in route handlers
    req.dbConfig = dbConfig;
    next();
  } catch (error) {
    console.error('Error validating API key:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Apply API key validation to all routes
router.use(validateApiKey);

// CRUD Operations

// GET - Read data
router.get('/data', async (req, res) => {
  try {
    const { pool, table } = req.dbConfig;
    const query = `SELECT * FROM ${table}`;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// POST - Create data
router.post('/data', async (req, res) => {
  try {
    const { pool, table } = req.dbConfig;
    const data = req.body;
    
    const columns = Object.keys(data).join(', ');
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    
    const query = `
      INSERT INTO ${table} (${columns}) 
      VALUES (${placeholders}) 
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating data:', error);
    res.status(500).json({ error: 'Failed to create data' });
  }
});

// PUT - Update data
router.put('/data/:id', async (req, res) => {
  try {
    const { pool, table } = req.dbConfig;
    const { id } = req.params;
    const data = req.body;
    
    const setClause = Object.keys(data)
      .map((key, i) => `${key} = $${i + 1}`)
      .join(', ');
    
    const values = [...Object.values(data), id];
    
    const query = `
      UPDATE ${table} 
      SET ${setClause} 
      WHERE id = $${values.length} 
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating data:', error);
    res.status(500).json({ error: 'Failed to update data' });
  }
});

// DELETE - Delete data
router.delete('/data/:id', async (req, res) => {
  try {
    const { pool, table } = req.dbConfig;
    const { id } = req.params;
    
    const query = `
      DELETE FROM ${table} 
      WHERE id = $1 
      RETURNING *
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Error deleting data:', error);
    res.status(500).json({ error: 'Failed to delete data' });
  }
});

module.exports = router;