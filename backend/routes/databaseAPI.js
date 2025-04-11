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

    // Get list of all databases
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
        // Check if api_keys table exists
        const tableExists = await dbPool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'api_keys'
          )
        `);

        if (tableExists.rows[0].exists) {
          const result = await dbPool.query(
            'SELECT database_name, table_name FROM api_keys WHERE key = $1 LIMIT 1',
            [apiKey]
          );
          
          if (result.rows.length > 0) {
            dbConfig = {
              database: db.datname,
              table: result.rows[0].table_name,
              pool: dbPool // Keep this pool for subsequent queries
            };
            break;
          }
        }
      } catch (err) {
        console.log(`Error checking database ${db.datname}:`, err.message);
      } finally {
        if (!dbConfig) {
          await dbPool.end(); // Only end if we're not using this pool
        }
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

// GET - Read all data
router.get('/', async (req, res) => {
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

// GET - Read single record
router.get('/:id', async (req, res) => {
  try {
    const { pool, table } = req.dbConfig;
    const { id } = req.params;
    
    const query = `SELECT * FROM ${table} WHERE id = $1`;
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching record:', error);
    res.status(500).json({ error: 'Failed to fetch record' });
  }
});

// POST - Create data
router.post('/', async (req, res) => {
  let client;
  try {
    const { pool, table } = req.dbConfig;
    const data = req.body;

    // Validate request body
    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'Request body cannot be empty' });
    }

    // Get a client from the pool
    client = await pool.connect();

    // Prepare query
    const columns = Object.keys(data).join(', ');
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    
    const query = `
      INSERT INTO ${table} (${columns}) 
      VALUES (${placeholders}) 
      RETURNING *
    `;

    // Execute query
    const result = await client.query(query, values);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating data:', {
      message: error.message,
      stack: error.stack,
      body: req.body,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({ 
      error: 'Failed to create data',
      details: process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'Internal server error'
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

// PUT - Update data
router.put('/:id', async (req, res) => {
  let client;
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
    
    client = await pool.connect();
    const result = await client.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating data:', error);
    res.status(500).json({ error: 'Failed to update data' });
  } finally {
    if (client) {
      client.release();
    }
  }
});

// DELETE - Delete data
router.delete('/:id', async (req, res) => {
  let client;
  try {
    const { pool, table } = req.dbConfig;
    const { id } = req.params;
    
    const query = `
      DELETE FROM ${table} 
      WHERE id = $1 
      RETURNING *
    `;
    
    client = await pool.connect();
    const result = await client.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Error deleting data:', error);
    res.status(500).json({ error: 'Failed to delete data' });
  } finally {
    if (client) {
      client.release();
    }
  }
});

module.exports = router;