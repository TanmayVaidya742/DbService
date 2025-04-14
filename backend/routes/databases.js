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
// In your POST route
router.post('/', upload.single('csvFile'), async (req, res) => {
  const { databaseName, tableName, columns } = req.body;
  const csvFile = req.file;
  let tempPool = null;
  let dbPool = null;

  try {
    // Validate required fields
    if (!databaseName || !tableName) {
      throw new Error('Database name and table name are required');
    }

    // Parse columns if they exist
    let parsedColumns = [];
    if (columns) {
      try {
        parsedColumns = JSON.parse(columns);
      } catch (err) {
        throw new Error('Invalid columns format');
      }
    }

    // Validate that we have either columns or CSV file
    if (parsedColumns.length === 0 && !csvFile) {
      throw new Error('Either columns or CSV file must be provided');
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

    let tableColumns = [];
    
    if (csvFile) {
      // Read CSV file to get column names
      await new Promise((resolve, reject) => {
        fs.createReadStream(csvFile.path)
          .pipe(csv())
          .on('headers', (headers) => {
            headers.forEach(header => {
              const cleanHeader = header.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
              tableColumns.push(`${cleanHeader} TEXT`);
            });
            resolve();
          })
          .on('error', reject);
      });
    } else {
      // Use the provided columns
      tableColumns = parsedColumns.map(col => `${col.name} ${col.type}`);
    }

    // Create the main table
    const createTableQuery = `CREATE TABLE ${tableName} (${tableColumns.join(', ')})`;
    await dbPool.query(createTableQuery);

    // Create api_keys table
    await dbPool.query(`
      CREATE TABLE api_keys (
        id SERIAL PRIMARY KEY,
        key TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Generate and insert API key
    const apiKey = generateApiKey();
    await dbPool.query('INSERT INTO api_keys (key) VALUES ($1)', [apiKey]);

    // Clean up the uploaded file if it exists
    if (csvFile) {
      fs.unlinkSync(csvFile.path);
    }

    res.status(201).json({
      message: 'Database and table created successfully',
      apiKey: apiKey
    });

  } catch (error) {
    console.error('Error creating database:', error);
    
    // Clean up the database if something went wrong
    if (tempPool) {
      try {
        await tempPool.query(`DROP DATABASE IF EXISTS ${databaseName}`);
      } catch (dropError) {
        console.error('Error dropping database:', dropError);
      }
    }
    
    // Clean up the uploaded file if it exists
    if (csvFile && fs.existsSync(csvFile.path)) {
      fs.unlinkSync(csvFile.path);
    }
    
    res.status(500).json({ error: error.message });
  } finally {
    if (tempPool) await tempPool.end().catch(console.error);
    if (dbPool) await dbPool.end().catch(console.error);
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

    // For each database, check if it has an api_keys table (created by our app)
    const userDatabases = [];
    for (const db of databases.rows) {
      const dbPool = new Pool({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: db.datname,
        password: process.env.DB_PASSWORD || 'postgres',
        port: process.env.DB_PORT || 5432,
      });

      try {
        // Check if this database has an api_keys table
        const hasApiKeyTable = await dbPool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'api_keys'
          )
        `);

        if (hasApiKeyTable.rows[0].exists) {
          // Get tables (excluding api_keys)
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

          userDatabases.push({
            name: db.datname,
            tables: tables.rows.map(t => t.table_name),
            apiKey: apiKey.rows[0]?.key || null
          });
        }
      } catch (err) {
        console.log(`Database ${db.datname} is not a user database (no api_keys table)`);
      } finally {
        await dbPool.end();
      }
    }

    res.json(userDatabases);
  } catch (error) {
    console.error('Error fetching databases:', error);
    res.status(500).json({ error: 'Failed to fetch databases' });
  } finally {
    if (tempPool) await tempPool.end().catch(console.error);
  }
});
// Add this route to your existing database routes
router.post('/:dbName/create-table', upload.single('csvFile'), async (req, res) => {
  const { tableName, columns } = req.body;
  const { dbName } = req.params;
  const csvFile = req.file;

  let dbPool = null;

  try {
    // Validate inputs
    if (!dbName || !tableName) {
      throw new Error('Database name and table name are required');
    }

    let parsedColumns = [];
    if (columns) {
      try {
        parsedColumns = JSON.parse(columns);
      } catch (err) {
        throw new Error('Invalid columns format');
      }
    }

    if (parsedColumns.length === 0 && !csvFile) {
      throw new Error('Either columns or CSV file must be provided');
    }

    // Connect to the existing database
    dbPool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: dbName,
      password: process.env.DB_PASSWORD || 'postgres',
      port: process.env.DB_PORT || 5432,
    });

    let tableColumns = [];

    if (csvFile) {
      await new Promise((resolve, reject) => {
        fs.createReadStream(csvFile.path)
          .pipe(csv())
          .on('headers', (headers) => {
            headers.forEach(header => {
              const cleanHeader = header.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
              tableColumns.push(`${cleanHeader} TEXT`);
            });
            resolve();
          })
          .on('error', reject);
      });
    } else {
      tableColumns = parsedColumns.map(col => `${col.name} ${col.type}`);
    }

    // Create the table
    const createTableQuery = `CREATE TABLE ${tableName} (${tableColumns.join(', ')})`;
    await dbPool.query(createTableQuery);

    // Delete uploaded file if exists
    if (csvFile) {
      fs.unlinkSync(csvFile.path);
    }

    res.status(201).json({
      message: `Table '${tableName}' created successfully in database '${dbName}'`
    });

  } catch (error) {
    console.error('Error creating table in existing DB:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;