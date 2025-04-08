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
    newPool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      port: process.env.DB_PORT || 5432,
    });

    // Check if database already exists
    const dbExists = await newPool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [databaseName]
    );

    if (dbExists.rows.length > 0) {
      return res.status(400).json({ error: 'Database already exists' });
    }

    // Create the new database
    await newPool.query(`CREATE DATABASE ${databaseName}`);

    // Connect to the new database
    dbPool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: databaseName,
      password: process.env.DB_PASSWORD || 'postgres',
      port: process.env.DB_PORT || 5432,
    });

    // Read CSV file and get column names
    const columns = [];
    const firstRow = await new Promise((resolve, reject) => {
      const stream = fs.createReadStream(csvFile.path)
        .pipe(csv())
        .on('headers', (headers) => {
          columns.push(...headers);
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
    await dbPool.query(`CREATE TABLE ${tableName} (${columnDefinitions})`);

    // Insert data from CSV
    const insertPromises = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvFile.path)
        .pipe(csv())
        .on('data', (data) => {
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

    await Promise.all(insertPromises);
    
    // Clean up uploaded file
    fs.unlinkSync(csvFile.path);
    
    res.status(201).json({ 
      message: 'Database and table created successfully',
      databaseName,
      tableName,
      columns
    });

  } catch (err) {
    console.error('Error creating database:', err);
    
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
      details: err.message
    });
  }
});

module.exports = router; 