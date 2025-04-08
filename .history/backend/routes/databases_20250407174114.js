const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file upload
const upload = multer({ 
  dest: uploadsDir,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv')) {
      return cb(new Error('Only CSV files are allowed'));
    }
    cb(null, true);
  }
});

// Create a new database and table from CSV
router.post('/', upload.single('csvFile'), async (req, res) => {
  let newPool = null;
  let dbPool = null;
  let csvFile = null;

  try {
    const { databaseName, tableName } = req.body;
    csvFile = req.file;

    console.log('Received request:', { databaseName, tableName, file: csvFile });

    if (!databaseName || !tableName || !csvFile) {
      return res.status(400).json({ error: 'Database name, table name, and CSV file are required' });
    }

    // Validate database name
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(databaseName)) {
      return res.status(400).json({ error: 'Invalid database name. Only letters, numbers, and underscores are allowed, and it must start with a letter or underscore.' });
    }

    // Validate table name
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
      return res.status(400).json({ error: 'Invalid table name. Only letters, numbers, and underscores are allowed, and it must start with a letter or underscore.' });
    }

    // Create a new connection pool for the new database
    const poolConfig = {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      port: process.env.DB_PORT || 5432,
    };

    console.log('Connecting with config:', { ...poolConfig, password: '***' });

    newPool = new Pool(poolConfig);

    // Test the connection
    try {
      await newPool.query('SELECT 1');
      console.log('Successfully connected to PostgreSQL');
    } catch (err) {
      console.error('Failed to connect to PostgreSQL:', err);
      throw new Error('Failed to connect to PostgreSQL: ' + err.message);
    }

    // Check if database already exists
    const dbExists = await newPool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [databaseName]
    );

    if (dbExists.rows.length > 0) {
      return res.status(400).json({ error: 'Database already exists' });
    }

    // Create the new database
    try {
      await newPool.query(`CREATE DATABASE ${databaseName}`);
      console.log(`Database ${databaseName} created successfully`);
    } catch (err) {
      console.error('Error creating database:', err);
      throw new Error('Failed to create database: ' + err.message);
    }

    // Connect to the new database
    dbPool = new Pool({
      ...poolConfig,
      database: databaseName
    });

    // Test the new database connection
    try {
      await dbPool.query('SELECT 1');
      console.log(`Successfully connected to database ${databaseName}`);
    } catch (err) {
      console.error(`Failed to connect to database ${databaseName}:`, err);
      throw new Error(`Failed to connect to new database: ${err.message}`);
    }

    // Read CSV file and get column names
    const columns = [];
    const firstRow = await new Promise((resolve, reject) => {
      const stream = fs.createReadStream(csvFile.path)
        .pipe(csv())
        .on('headers', (headers) => {
          columns.push(...headers);
          console.log('CSV headers:', headers);
        })
        .on('data', (data) => {
          resolve(data);
          stream.destroy();
        })
        .on('error', (err) => {
          reject(err);
        });
    });

    if (columns.length === 0) {
      throw new Error('CSV file is empty or invalid');
    }

    // Create table with columns from CSV
    const columnDefinitions = columns.map(col => `${col} TEXT`).join(', ');
    try {
      await dbPool.query(`CREATE TABLE ${tableName} (${columnDefinitions})`);
      console.log(`Table ${tableName} created successfully with columns:`, columns);
    } catch (err) {
      console.error('Error creating table:', err);
      throw new Error('Failed to create table: ' + err.message);
    }

    // Insert data from CSV
    const insertPromises = [];
    let rowCount = 0;
    
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvFile.path)
        .pipe(csv())
        .on('data', (data) => {
          rowCount++;
          const values = columns.map(col => data[col]);
          const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
          insertPromises.push(
            dbPool.query(
              `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`,
              values
            )
          );
        })
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`Inserting ${rowCount} rows into table ${tableName}`);
    await Promise.all(insertPromises);
    console.log('Data insertion completed');
    
    // Clean up uploaded file
    fs.unlinkSync(csvFile.path);
    
    res.status(201).json({ 
      message: 'Database and table created successfully',
      databaseName,
      tableName,
      columns,
      rowCount
    });

  } catch (err) {
    console.error('Error in database creation process:', err);
    
    // Clean up resources in case of error
    if (csvFile && fs.existsSync(csvFile.path)) {
      fs.unlinkSync(csvFile.path);
    }
    
    if (newPool) {
      await newPool.end();
    }
    if (dbPool) {
      await dbPool.end();
    }

    res.status(500).json({ 
      error: 'Error creating database',
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

module.exports = router; 