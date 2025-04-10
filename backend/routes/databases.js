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

// POST route to create a new database and table from CSV
router.post('/', upload.single('csvFile'), async (req, res) => {
  const { databaseName, tableName } = req.body;
  const csvFile = req.file;
  let tempPool = null;
  let dbPool = null;

  try {
    console.log('Received request:', { databaseName, tableName, file: csvFile?.originalname });

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
      password: process.env.DB_PASSWORD || 'pass',
      port: process.env.DB_PORT || 5432,
    });

    // Test connection
    try {
      await tempPool.query('SELECT 1');
      console.log('Successfully connected to PostgreSQL');
    } catch (err) {
      console.error('Failed to connect to PostgreSQL:', err);
      throw new Error('Failed to connect to PostgreSQL: ' + err.message);
    }

    // Check if database exists
    const dbExists = await tempPool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [databaseName]
    );

    if (dbExists.rows.length > 0) {
      console.log(`Database ${databaseName} already exists`);
      // Database exists, connect to it
      dbPool = new Pool({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: databaseName,
        password: process.env.DB_PASSWORD || 'postgres',
        port: process.env.DB_PORT || 5432,
      });

      // Test connection to existing database
      try {
        await dbPool.query('SELECT 1');
        console.log(`Successfully connected to database ${databaseName}`);
      } catch (err) {
        console.error(`Failed to connect to database ${databaseName}:`, err);
        throw new Error(`Failed to connect to existing database: ${err.message}`);
      }
    } else {
      // Create new database
      try {
        await tempPool.query(`CREATE DATABASE ${databaseName}`);
        console.log(`Created database: ${databaseName}`);
      } catch (err) {
        console.error('Error creating database:', err);
        throw new Error('Failed to create database: ' + err.message);
      }

      // Connect to the new database
      dbPool = new Pool({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: databaseName,
        password: process.env.DB_PASSWORD || 'postgres',
        port: process.env.DB_PORT || 5432,
      });

      // Test connection to new database
      try {
        await dbPool.query('SELECT 1');
        console.log(`Successfully connected to new database ${databaseName}`);
      } catch (err) {
        console.error(`Failed to connect to new database ${databaseName}:`, err);
        throw new Error(`Failed to connect to new database: ${err.message}`);
      }
    }

    // Read CSV file to get column names
    const columns = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvFile.path)
        .pipe(csv())
        .on('headers', (headers) => {
          console.log('CSV headers:', headers);
          headers.forEach(header => {
            const cleanHeader = header.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
            columns.push(`${cleanHeader} TEXT`);
          });
          resolve();
        })
        .on('error', reject);
    });

    console.log('Creating table with columns:', columns);

    // Create table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id SERIAL PRIMARY KEY,
        ${columns.join(',\n        ')}
      )
    `;
    try {
      await dbPool.query(createTableQuery);
      console.log(`Created table: ${tableName}`);
    } catch (err) {
      console.error('Error creating table:', err);
      throw new Error('Failed to create table: ' + err.message);
    }

    // Insert data from CSV
    let insertedRows = 0;
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvFile.path)
        .pipe(csv())
        .on('data', async (row) => {
          const columns = Object.keys(row);
          const values = Object.values(row);
          const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
          
          try {
            await dbPool.query(
              `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`,
              values
            );
            insertedRows++;
          } catch (err) {
            console.error('Error inserting row:', err);
            reject(err);
          }
        })
        .on('error', reject)
        .on('end', resolve);
    });

    console.log(`Inserted ${insertedRows} rows into ${tableName}`);

    // Clean up
    fs.unlinkSync(csvFile.path);
    
    res.status(201).json({
      message: 'Database and table created successfully',
      database: databaseName,
      table: tableName,
      rowsInserted: insertedRows
    });

  } catch (error) {
    console.error('Error in database creation process:', error);
    
    // Clean up on error
    if (csvFile && fs.existsSync(csvFile.path)) {
      fs.unlinkSync(csvFile.path);
    }
    
    // Send appropriate error response
    if (error.message.includes('already exists')) {
      res.status(400).json({
        error: 'Database already exists',
        message: error.message
      });
    } else if (error.message.includes('Only CSV files are allowed')) {
      res.status(400).json({
        error: 'Invalid file type',
        message: error.message
      });
    } else if (error.message.includes('required')) {
      res.status(400).json({
        error: 'Missing required fields',
        message: error.message
      });
    } else {
      res.status(500).json({
        error: 'Database creation failed',
        message: error.message
      });
    }

  } finally {
    // Close database connections
    if (dbPool) {
      try {
        await dbPool.end();
        console.log('Closed database connection');
      } catch (err) {
        console.error('Error closing database connection:', err);
      }
    }
    if (tempPool) {
      try {
        await tempPool.end();
        console.log('Closed temporary connection');
      } catch (err) {
        console.error('Error closing temporary connection:', err);
      }
    }
  }
});

module.exports = router; 