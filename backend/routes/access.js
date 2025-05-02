
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const {mainPool} = require('../config/db')

// ✅ Middleware to validate API key
const validateApiKey = async (req, res, next) => {
  const apiKey = req.headers['api-key'];
  if (!apiKey) return res.status(401).json({ error: 'API key missing' });

  try {
    const result = await mainPool.query('SELECT * FROM db_collection WHERE apikey = $1', [apiKey]);
    if (result.rows.length === 0) return res.status(403).json({ error: 'Invalid API key' });

    req.user = result.rows[0];
    next();
    
  } catch (err) {
    console.error('Error validating API key:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ✅ Reuse DB connections
const poolCache = {};
const getDbPool = (dbname) => {
  if (!/^[a-zA-Z0-9_]+$/.test(dbname)) {
    throw new Error('Invalid database name');
  }

  if (!poolCache[dbname]) {
    poolCache[dbname] = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: dbname,
      password: process.env.DB_PASSWOcclRD || 'postgres',
      port: process.env.DB_PORT || 5432,
    });
  }

  return poolCache[dbname];
};

// ✅ Ensure the database exists
const ensureDatabaseExists = async (dbname) => {
  const exists = await mainPool.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbname]);
  if (exists.rows.length === 0) {
    await mainPool.query(`CREATE DATABASE "${dbname}"`);
    console.log(`✅ Database "${dbname}" created`);
  } else {
    console.log(`ℹ️  Database "${dbname}" already exists`);
  }
};






  router.post('/:dbname/:tablename/create', validateApiKey, async (req, res) => {
    const { dbname, tablename } = req.params;
  
    try {
      // Ensure the database exists
      await ensureDatabaseExists(dbname);
  
      // Connect to it
      const pool = getDbPool(dbname);
  
      // Create a truly blank table (with just an ID)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS ${tablename} (
          id SERIAL PRIMARY KEY
        )
      `);
  
      return res.status(201).json({
        message: 'Database and blank table (with only ID) created successfully',
      });
  
    } catch (err) {
      console.error('❌ Error in POST create route:', err);
      return res.status(500).json({ error: 'Internal server error', details: err.message });
    }
  });

 
  router.delete('/:dbname/:tablename/drop', validateApiKey, async (req, res) => {
    const { dbname, tablename } = req.params;
  
    if (!/^[a-zA-Z0-9_]+$/.test(tablename)) {
      return res.status(400).json({ error: 'Invalid table name' });
    }
  
    try {
      const pool = getDbPool(dbname);
  
      await pool.query(`DROP TABLE IF EXISTS ${tablename}`);
  
      return res.status(200).json({
        message: `Table "${tablename}" dropped successfully from database "${dbname}"`,
      });
    } catch (err) {
      console.error('❌ Error dropping table:', err);
      return res.status(500).json({ error: 'Internal server error', details: err.message });
    }
  });
  
  router.delete('/:dbname/dropdb', validateApiKey, async (req, res) => {
    const { dbname } = req.params;
  
    // Basic validation
    if (!/^[a-zA-Z0-9_]+$/.test(dbname)) {
      return res.status(400).json({ error: 'Invalid database name' });
    }
  
    try {
      // End connection to that DB if already pooled
      if (poolCache[dbname]) {
        await poolCache[dbname].end();
        delete poolCache[dbname];
      }
  
      // Use mainPool to drop the DB
      await mainPool.query(`DROP DATABASE IF EXISTS "${dbname}"`);
  
      return res.status(200).json({
        message: `Database "${dbname}" dropped successfully`,
      });
  
    } catch (err) {
      console.error('❌ Error dropping database:', err);
      return res.status(500).json({ error: 'Internal server error', details: err.message });
    }
  });

  // ✅ Check if a mobile number exists in a table
router.post('/:dbname/:tablename/check-mobile', validateApiKey, async (req, res) => {
  const { dbname, tablename } = req.params;
  const { mobile_no } = req.body;

  if (!mobile_no) {
    return res.status(400).json({ error: 'mobile_no is required in request body' });
  }

  try {
    const pool = getDbPool(dbname);

    // Using parameterized query to prevent SQL injection
    const query = `SELECT * FROM ${tablename} WHERE mobile_no = $1`;
    const result = await pool.query(query, [mobile_no]);

    if (result.rows.length > 0) {
      return res.status(200).json({ exists: true, data: result.rows });
    } else {
      return res.status(404).json({ exists: false, message: 'Mobile number not found' });
    }
  } catch (err) {
    console.error('❌ Error checking mobile number:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});



router.post('/:dbname/:tablename/get', validateApiKey, async (req, res) => {
  const { dbname, tablename } = req.params;
  const filters = req.body.filter;

  try {
    const pool = getDbPool(dbname);

    if (!filters || Object.keys(filters).length === 0) {
      return res.status(400).json({ error: 'No filter object provided in request body' });
    }

    // Build WHERE clause dynamically
    const conditions = Object.keys(filters).map((key, i) => `${key} = $${i + 1}`).join(' AND ');
    const values = Object.values(filters);

    const query = `SELECT * FROM ${tablename} WHERE ${conditions}`;
    const result = await pool.query(query, values);

    // Always return status 200 with data array (empty or not)
    res.status(200).json({
      message: result.rows.length === 0 ? 'No matching rows found' : 'Matching rows found',
      data: result.rows,
    });
  } catch (err) {
    console.error('❌ Error filtering rows:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});


  router.post('/:dbname/:tablename/insert',validateApiKey, async (req, res) => {
    const { dbname, tablename } = req.params;
    const { data } = req.body;
  
    if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'Invalid or empty data object in request body' });
    }
  
    try {
      const pool = getDbPool(dbname);
  
      const columns = Object.keys(data);
      const values = Object.values(data);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
  
      const query = `INSERT INTO ${tablename} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`;
      const result = await pool.query(query, values);
  
      res.status(201).json({
        message: 'Row inserted successfully',
        data: result.rows[0],
      });
    } catch (err) {
      console.error('❌ Error inserting row:', err);
      res.status(500).json({ error: 'Internal server error', details: err.message });
    }
  });



  router.post('/:dbname/:tablename/update', validateApiKey, async (req, res) => {
    const { dbname, tablename } = req.params;
    const { filter, data } = req.body;
  
    if (!filter || typeof filter !== 'object' || Object.keys(filter).length === 0) {
      return res.status(400).json({ error: 'Invalid or missing filter object' });
    }
  
    if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'Invalid or missing data object' });
    }
  
    try {
      const pool = getDbPool(dbname);
  
      // Build SET clause for update
      const setColumns = Object.keys(data).map((col, i) => `${col} = $${i + 1}`);
      const setValues = Object.values(data);
  
      // Build WHERE clause for filter
      const filterOffset = setValues.length;
      const whereColumns = Object.keys(filter).map((col, i) => `${col} = $${i + 1 + filterOffset}`);
      const whereValues = Object.values(filter);
  
      const query = `UPDATE ${tablename} SET ${setColumns.join(', ')} WHERE ${whereColumns.join(' AND ')} RETURNING *`;
  
      const result = await pool.query(query, [...setValues, ...whereValues]);
  
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'No matching rows found to update' });
      }
  
      res.status(200).json({
        message: 'Row(s) updated successfully',
        data: result.rows,
      });
    } catch (err) {
      console.error('❌ Error updating row:', err);
      res.status(500).json({ error: 'Internal server error', details: err.message });
    }
  });

  router.post('/:dbname/:tablename/delete-row', validateApiKey, async (req, res) => {
    const { dbname, tablename } = req.params;
    const { filter } = req.body;
  
    if (!filter || Object.keys(filter).length === 0) {
      return res.status(400).json({ error: 'Filter object is required to delete rows' });
    }
  
    try {
      const pool = getDbPool(dbname);
  
      // Build dynamic WHERE clause
      const conditions = Object.keys(filter)
        .map((key, index) => `${key} = $${index + 1}`)
        .join(' AND ');
      const values = Object.values(filter);
  
      const query = `DELETE FROM ${tablename} WHERE ${conditions} RETURNING *`;
      const result = await pool.query(query, values);
  
      if (result.rowCount === 0) {
        return res.status(404).json({ message: 'No matching rows found to delete' });
      }
  
      res.status(200).json({
        message: 'Rows deleted successfully',
        deleted: result.rows,
      });
    } catch (err) {
      console.error('❌ Error deleting row:', err);
      res.status(500).json({ error: 'Internal server error', details: err.message });
    }
  });

  router.post('/:dbname/:tablename/delete', validateApiKey, async (req, res) => {
    const { dbname, tablename } = req.params;
    const { filter } = req.body;
  
    if (!filter || Object.keys(filter).length === 0) {
      return res.status(400).json({ error: 'Filter object is required to delete rows' });
    }
  
    try {
      const pool = getDbPool(dbname);
  
      // Build dynamic WHERE clause
      const conditions = Object.keys(filter)
        .map((key, index) => `${key} = $${index + 1}`)
        .join(' AND ');
      const values = Object.values(filter);
  
      const query = `DELETE FROM ${tablename} WHERE ${conditions} RETURNING *`;
      const result = await pool.query(query, values);
  
      if (result.rowCount === 0) {
        return res.status(404).json({ message: 'No matching rows found to delete' });
      }
  
      res.status(200).json({
        message: 'Rows deleted successfully',
        deleted: result.rows,
      });
    } catch (err) {
      console.error('❌ Error deleting row:', err);
      res.status(500).json({ error: 'Internal server error', details: err.message });
    }
  });
  
  
  
  


  

 

module.exports = router;


