const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const csv = require('csv-parser');
require('dotenv').config();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// Utility function to generate API key
const generateApiKey = () => {
  const buffer = require('crypto').randomBytes(32);
  return buffer.toString('hex');
};

// POST route to create a new database and table from CSV
router.post('/', upload.single('csvFile'), async (req, res) => {
  const { databaseName, tableName } = req.body;
  const csvFile = req.file;
  let tempPool = null;
  let dbPool = null;

  try {
    // Validate required fields
    if (!databaseName || !tableName || !csvFile) {
      throw new Error('Database name, table name, and CSV file are required');
    }

    // Validate database and table names
    const nameRegex = /^[a-zA-Z0-9_]+$/;
    if (!nameRegex.test(databaseName) || !nameRegex.test(tableName)) {
      throw new Error('Database and table names can only contain letters, numbers, and underscores');
    }

    // Connect to postgres database first
    tempPool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      port: process.env.DB_PORT || 5432,
    });

    // Create new database
    await tempPool.query(`CREATE DATABASE ${databaseName}`);

    // Connect to the new database
    dbPool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: databaseName,
      password: process.env.DB_PASSWORD || 'postgres',
      port: process.env.DB_PORT || 5432,
    });

    // Read CSV file to get column names
    const columns = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvFile.path)
        .pipe(csv())
        .on('headers', (headers) => {
          headers.forEach(header => {
            const cleanHeader = header.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
            columns.push(`${cleanHeader} TEXT`);
          });
          resolve();
        })
        .on('error', reject);
    });

    // Create main table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id SERIAL PRIMARY KEY,
        ${columns.join(',\n        ')}
      )
    `;
    await dbPool.query(createTableQuery);

    // Create API key table and store API key
    const apiKey = generateApiKey();
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id SERIAL PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        database_name TEXT NOT NULL,
        table_name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await dbPool.query(
      'INSERT INTO api_keys (key, database_name, table_name) VALUES ($1, $2, $3)',
      [apiKey, databaseName, tableName]
    );

    // Insert data from CSV
    let insertedRows = 0;
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvFile.path)
        .pipe(csv())
        .on('data', async (row) => {
          const columns = Object.keys(row);
          const values = Object.values(row);
          const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
          
          await dbPool.query(
            `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`,
            values
          );
          insertedRows++;
        })
        .on('error', reject)
        .on('end', resolve);
    });

    fs.unlinkSync(csvFile.path);
    
    res.status(201).json({
      message: 'Database and table created successfully',
      database: databaseName,
      table: tableName,
      rowsInserted: insertedRows,
      apiKey: apiKey
    });

  } catch (error) {
    console.error('Error in database creation process:', error);
    
    if (csvFile && fs.existsSync(csvFile.path)) {
      fs.unlinkSync(csvFile.path);
    }
    
    const status = error.message.includes('already exists') ? 400 :
                 error.message.includes('Only CSV files') ? 400 :
                 error.message.includes('required') ? 400 : 500;
    
    res.status(status).json({
      error: status === 500 ? 'Database creation failed' : error.message.split(':')[0],
      message: error.message
    });

  } finally {
    if (dbPool) await dbPool.end().catch(console.error);
    if (tempPool) await tempPool.end().catch(console.error);
  }
});

// New route to fetch all databases
router.get('/', async (req, res) => {
  let tempPool = null;
  try {
    tempPool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      port: process.env.DB_PORT || 5432,
    });

    // Get all non-system databases
    const databases = await tempPool.query(`
      SELECT datname FROM pg_database 
      WHERE datistemplate = false AND datname NOT IN ('postgres')
    `);

    // For each database, get its tables and API key
    const databasesWithDetails = await Promise.all(
      databases.rows.map(async (db) => {
        const dbPool = new Pool({
          user: process.env.DB_USER || 'postgres',
          host: process.env.DB_HOST || 'localhost',
          database: db.datname,
          password: process.env.DB_PASSWORD || 'postgres',
          port: process.env.DB_PORT || 5432,
        });

        try {
          // Get tables
          const tables = await dbPool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name != 'api_keys'
          `);

          // Get API key
          const apiKey = await dbPool.query(`
            SELECT key FROM api_keys LIMIT 1
          `);

          await dbPool.end();

          return {
            name: db.datname,
            tables: tables.rows.map(t => t.table_name),
            apiKey: apiKey.rows[0]?.key || null
          };
        } catch (err) {
          await dbPool.end();
          return {
            name: db.datname,
            tables: [],
            apiKey: null
          };
        }
      })
    );

    res.json(databasesWithDetails);
  } catch (error) {
    console.error('Error fetching databases:', error);
    res.status(500).json({ error: 'Failed to fetch databases' });
  } finally {
    if (tempPool) await tempPool.end().catch(console.error);
  }
});

module.exports = router;