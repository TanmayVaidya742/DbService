// const express = require('express');
// const router = express.Router();
// const { Pool } = require('pg');
// const { mainPool } = require('../mainpool/db');

// // ✅ Middleware to validate API key
// const validateApiKey = async (req, res, next) => {
//   const apiKey = req.headers['x-api-key'];
//   if (!apiKey) return res.status(401).json({ error: 'API key missing' });

//   try {
//     const result = await mainPool.query('SELECT * FROM users WHERE user_id = $1', [apiKey]);
//     if (result.rows.length === 0) return res.status(403).json({ error: 'Invalid API key' });

//     req.user = result.rows[0]; // will have username
//     next();
//   } catch (err) {
//     console.error('Error validating API key:', err);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };

// // ✅ Reuse DB connections
// const poolCache = {};
// const getDbPool = (dbname) => {
//   if (!/^[a-zA-Z0-9_]+$/.test(dbname)) {
//     throw new Error('Invalid database name');
//   }

//   if (!poolCache[dbname]) {
//     poolCache[dbname] = new Pool({
//       user: process.env.DB_USER || 'postgres',
//       host: process.env.DB_HOST || 'localhost',
//       database: dbname,
//       password: process.env.DB_PASSWORD || 'postgres',
//       port: process.env.DB_PORT || 5432,
//     });
//   }

//   return poolCache[dbname];
// };

// // ✅ Ensure the database exists
// const ensureDatabaseExists = async (dbname) => {
//   const exists = await mainPool.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbname]);
//   if (exists.rows.length === 0) {
//     await mainPool.query(`CREATE DATABASE "${dbname}"`);
//     console.log(`✅ Database "${dbname}" created`);
//   } else {
//     console.log(`ℹ️  Database "${dbname}" already exists`);
//   }
// };

// // ✅ Main POST route
// router.post('/:dbname/:tablename/create', validateApiKey, async (req, res) => {
//   const { dbname, tablename } = req.params;

//   try {
//     // 1. Ensure the database exists
//     await ensureDatabaseExists(dbname);

//     // 2. Connect to it
//     const pool = getDbPool(dbname);

//     // 3. Ensure the table exists (id + username)
//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS ${tablename} (
//         id SERIAL PRIMARY KEY,
//         username TEXT NOT NULL
//       )
//     `);

//     // 4. Insert the current user’s username
//     const insertResult = await pool.query(
//       `INSERT INTO ${tablename} (username) VALUES ($1) RETURNING *`,
//       [req.user.username]
//     );

//     return res.status(201).json({
//       message: 'Database, table created and username inserted successfully',
//       data: insertResult.rows[0],
//     });

//   } catch (err) {
//     console.error('❌ Error in POST create route:', err);
//     return res.status(500).json({ error: 'Internal server error', details: err.message });
//   }
// });

// module.exports = router;

//-----------------------------------------------------------------------------------------------------------------------------

// const express = require('express');
// const router = express.Router();
// const { Pool } = require('pg');
// const { mainPool } = require('../mainpool/db');

// // ✅ Middleware to validate API key
// const validateApiKey = async (req, res, next) => {
//   const apiKey = req.headers['x-api-key'];
//   if (!apiKey) return res.status(401).json({ error: 'API key missing' });

//   try {
//     const result = await mainPool.query('SELECT * FROM users WHERE user_id = $1', [apiKey]);
//     if (result.rows.length === 0) return res.status(403).json({ error: 'Invalid API key' });

//     req.user = result.rows[0]; // Will have username
//     next();
//   } catch (err) {
//     console.error('Error validating API key:', err);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };

// // ✅ Reuse DB connections
// const poolCache = {};
// const getDbPool = (dbname) => {
//   if (!/^[a-zA-Z0-9_]+$/.test(dbname)) {
//     throw new Error('Invalid database name');
//   }

//   if (!poolCache[dbname]) {
//     poolCache[dbname] = new Pool({
//       user: process.env.DB_USER || 'postgres',
//       host: process.env.DB_HOST || 'localhost',
//       database: dbname,
//       password: process.env.DB_PASSWORD || 'postgres',
//       port: process.env.DB_PORT || 5432,
//     });
//   }

//   return poolCache[dbname];
// };

// // ✅ Ensure the database exists
// const ensureDatabaseExists = async (dbname) => {
//   const exists = await mainPool.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbname]);
//   if (exists.rows.length === 0) {
//     await mainPool.query(`CREATE DATABASE "${dbname}"`);
//     console.log(`✅ Database "${dbname}" created`);
//   } else {
//     console.log(`ℹ️  Database "${dbname}" already exists`);
//   }
// };

// // ✅ Main POST route
// router.post('/:dbname/:tablename/create', validateApiKey, async (req, res) => {
//   const { dbname, tablename } = req.params;

//   try {
//     // 1. Ensure the database exists
//     await ensureDatabaseExists(dbname);

//     // 2. Connect to it
//     const pool = getDbPool(dbname);

//     // 3. Ensure the table exists (id + username)
//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS ${tablename} (
//         id SERIAL PRIMARY KEY,
//         username TEXT NOT NULL
//       )
//     `);

//     return res.status(201).json({
//       message: 'Database and table created (or already exist)',
//     });

//   } catch (err) {
//     console.error('❌ Error in POST create route:', err);
//     return res.status(500).json({ error: 'Internal server error', details: err.message });
//   }
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { mainPool } = require('../mainpool/db');

// ✅ Middleware to validate API key
const validateApiKey = async (req, res, next) => {
  const apiKey = req.headers['api-key'];
  if (!apiKey) return res.status(401).json({ error: 'API key missing' });

  try {
    const result = await mainPool.query('SELECT * FROM db_collection WHERE user_id = $1', [apiKey]);
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
      password: process.env.DB_PASSWORD || 'postgres',
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

// ✅ Main POST route
// router.post('/:dbname/:tablename/create', validateApiKey, async (req, res) => {
//   const { dbname, tablename } = req.params;

//   try {
//     // 1. Ensure the database exists
//     await ensureDatabaseExists(dbname);

//     // 2. Connect to it
//     const pool = getDbPool(dbname);

//     // 3. Create an empty table (minimum: one dummy column)
//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS ${tablename} (
//         dummy TEXT
//       )
//     `);

//     return res.status(201).json({
//       message: 'Database and empty table created successfully',
//     });

//   } catch (err) {
//     console.error('❌ Error in POST create route:', err);
//     return res.status(500).json({ error: 'Internal server error', details: err.message });
//   }
// });
// router.post('/:dbname/:tablename/create', validateApiKey, async (req, res) => {
//     const { dbname, tablename } = req.params;
  
//     try {
//       // Ensure the database exists
//       await ensureDatabaseExists(dbname);
  
//       // Connect to it
//       const pool = getDbPool(dbname);
  
//       // Create a truly blank table (with just an ID)
//       await pool.query(`
//         CREATE TABLE IF NOT EXISTS ${tablename} (
//           id SERIAL PRIMARY KEY
//         )
//       `);
  
//       return res.status(201).json({
//         message: 'Database and blank table (with only ID) created successfully',
//       });
  
//     } catch (err) {
//       console.error('❌ Error in POST create route:', err);
//       return res.status(500).json({ error: 'Internal server error', details: err.message });
//     }
//   });

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

  // router.post('/:dbname/:tablename/insert', validateApiKey, async (req, res) => {
  //   const { dbname, tablename } = req.params;
  //   const data = req.body;
  
  //   try {
  //     const pool = getDbPool(dbname);
  
  //     // Ensure the table name is safe
  //     if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tablename)) {
  //       return res.status(400).json({ error: 'Invalid table name' });
  //     }
  
  //     // Step 1: Get existing columns
  //     const existingColsResult = await pool.query(`
  //       SELECT column_name
  //       FROM information_schema.columns
  //       WHERE table_name = $1
  //     `, [tablename]);
  
  //     const existingCols = existingColsResult.rows.map(r => r.column_name);
  
  //     // Step 2: Add any new columns
  //     for (const [key, value] of Object.entries(data)) {
  //       if (!existingCols.includes(key)) {
  //         let type = 'TEXT'; // Default to TEXT
  
  //         if (typeof value === 'number') {
  //           type = Number.isInteger(value) ? 'INTEGER' : 'REAL';
  //         }
  
  //         await pool.query(`ALTER TABLE "${tablename}" ADD COLUMN "${key}" ${type}`);
  //       }
  //     }
  
  //     // Step 3: Insert the row
  //     const keys = Object.keys(data);
  //     const values = Object.values(data);
  //     const columns = keys.map(k => `"${k}"`).join(", ");
  //     const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
  
  //     await pool.query(
  //       `INSERT INTO "${tablename}" (${columns}) VALUES (${placeholders})`,
  //       values
  //     );
  
  //     return res.status(201).json({ message: 'Row inserted successfully' });
  
  //   } catch (err) {
  //     console.error('❌ Error inserting row:', err);
  //     return res.status(500).json({ error: 'Internal server error', details: err.message });
  //   }
  // });


  // router.put('/:dbname/:tablename/update/:id', validateApiKey, async (req, res) => {
  //   const { dbname, tablename, id } = req.params;
  //   const data = req.body;
  
  //   try {
  //     const pool = getDbPool(dbname);
  
  //     // Validate table name
  //     if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tablename)) {
  //       return res.status(400).json({ error: 'Invalid table name' });
  //     }
  
  //     // Step 1: Get existing columns
  //     const existingColsResult = await pool.query(`
  //       SELECT column_name
  //       FROM information_schema.columns
  //       WHERE table_name = $1
  //     `, [tablename]);
  
  //     const existingCols = existingColsResult.rows.map(r => r.column_name);
  
  //     // Step 2: Add any missing columns
  //     for (const [key, value] of Object.entries(data)) {
  //       if (!existingCols.includes(key)) {
  //         let type = 'TEXT';
  
  //         if (typeof value === 'number') {
  //           type = Number.isInteger(value) ? 'INTEGER' : 'REAL';
  //         }
  
  //         await pool.query(`ALTER TABLE "${tablename}" ADD COLUMN "${key}" ${type}`);
  //       }
  //     }
  
  //     // Step 3: Build update query
  //     const keys = Object.keys(data);
  //     const values = Object.values(data);
  //     const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(", ");
  
  //     // Add id as the last value for the WHERE clause
  //     values.push(id);
  
  //     const updateQuery = `
  //       UPDATE "${tablename}"
  //       SET ${setClause}
  //       WHERE id = $${values.length}
  //     `;
  
  //     const result = await pool.query(updateQuery, values);
  
  //     if (result.rowCount === 0) {
  //       return res.status(404).json({ message: 'Row not found' });
  //     }
  
  //     return res.status(200).json({ message: 'Row updated successfully' });
  
  //   } catch (err) {
  //     console.error('❌ Error updating row:', err);
  //     return res.status(500).json({ error: 'Internal server error', details: err.message });
  //   }
  // });

  // router.delete('/:dbname/:tablename/delete/:id', validateApiKey, async (req, res) => {
  //   const { dbname, tablename, id } = req.params;
  
  //   if (!/^[a-zA-Z0-9_]+$/.test(tablename)) {
  //     return res.status(400).json({ error: 'Invalid table name' });
  //   }
  
  //   try {
  //     const pool = getDbPool(dbname);
  
  //     const result = await pool.query(
  //       `DELETE FROM ${tablename} WHERE id = $1 RETURNING *`,
  //       [id]
  //     );
  
  //     if (result.rows.length === 0) {
  //       return res.status(404).json({ message: 'Row not found' });
  //     }
  
  //     return res.status(200).json({
  //       message: 'Row deleted successfully',
  //       data: result.rows[0],
  //     });
  //   } catch (err) {
  //     console.error('❌ Error deleting row:', err);
  //     return res.status(500).json({ error: 'Internal server error', details: err.message });
  //   }
  // });

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
  
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'No matching rows found' });
      }
  
      res.status(200).json({
        message: 'Matching rows found',
        data: result.rows,
      });
    } catch (err) {
      console.error('❌ Error filtering rows:', err);
      res.status(500).json({ error: 'Internal server error', details: err.message });
    }
  });

  router.post('/:dbname/:tablename/insert', validateApiKey, async (req, res) => {
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
  
  
  
  


  

  // router.post('/:dbname/:tablename/get', validateApiKey, async (req, res) => {
  //   const { dbname, tablename } = req.params;
  //   const filters = req.body;
  
  //   try {
  //     const pool = getDbPool(dbname);
  
  //     // No filters provided
  //     if (!filters || Object.keys(filters).length === 0) {
  //       return res.status(400).json({ error: 'No filter object provided in request body' });
  //     }
  
  //     // Build WHERE clause dynamically
  //     const conditions = Object.keys(filters).map((key, i) => `${key} = $${i + 1}`).join(' AND ');
  //     const values = Object.values(filters);
  
  //     const query = `SELECT * FROM ${tablename} WHERE ${conditions}`;
  //     const result = await pool.query(query, values);
  
  //     if (result.rows.length === 0) {
  //       return res.status(404).json({ message: 'No matching rows found' });
  //     }
  
  //     res.status(200).json({
  //       message: 'Matching rows found',
  //       data: result.rows,
  //     });
  //   } catch (err) {
  //     console.error('❌ Error filtering rows:', err);
  //     res.status(500).json({ error: 'Internal server error', details: err.message });
  //   }
  // });
  
      
  
  
  
  
  

// ✅ Insert row with columns dynamically
// router.post('/:dbname/:tablename/insert', validateApiKey, async (req, res) => {
//     const { dbname, tablename } = req.params;
//     const data = req.body;
  
//     if (!data || Object.keys(data).length === 0) {
//       return res.status(400).json({ error: 'No data provided in request body' });
//     }
  
//     try {
//       const pool = getDbPool(dbname);
  
//       const columns = Object.keys(data);
//       const values = Object.values(data);
//       const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
  
//       const query = `INSERT INTO ${tablename} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`;
//       const result = await pool.query(query, values);
  
//       res.status(201).json({
//         message: 'Row inserted successfully',
//         data: result.rows[0],
//       });
//     } catch (err) {
//       console.error('❌ Error inserting row:', err);
//       res.status(500).json({ error: 'Internal server error', details: err.message });
//     }
//   });
  

module.exports = router;


