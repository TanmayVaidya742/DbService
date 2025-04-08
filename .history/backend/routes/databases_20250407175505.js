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
    // Validate required fields
    if (!databaseName || !tableName || !csvFile) {
      throw new Error('Database name, table name, and CSV file are required');
    }

    // Validate database and table names (only allow letters, numbers, and underscores)
    const nameRegex = /^[a-zA-Z0-9_]+$/;
    if (!nameRegex.test(databaseName) || !nameRegex.test(tableName)) {
      throw new Error('Database and table names can only contain letters, numbers, and underscores');
    }

    console.log(`Attempting to create database: ${databaseName}`);

    // Connect to postgres database first
    tempPool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      port: process.env.DB_PORT || 5432,
    });

    // Check if database exists
    const dbExists = await tempPool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [databaseName]
    );

    if (dbExists.rows.length > 0) {
      throw new Error(`Database "${databaseName}" already exists. Please choose a different name.`);
    }

    // Create new database
    await tempPool.query(`CREATE DATABASE ${databaseName}`);
    console.log(`Created database: ${databaseName}`);

    // Connect to the new database
    dbPool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: databaseName,
      password: process.env.DB_PASSWORD || 'postgres',
      port: process.env.DB_PORT || 5432,
    });

    // Read CSV file to get column names and types
    const columns = [];
    let firstRow = true;

    await new Promise((resolve, reject) => {
      fs.createReadStream(csvFile.path)
        .pipe(csv())
        .on('headers', (headers) => {
          headers.forEach(header => {
            // Clean header name (remove spaces and special characters)
            const cleanHeader = header.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
            columns.push(`${cleanHeader} TEXT`);
          });
        })
        .on('data', () => {
          if (firstRow) {
            firstRow = false;
            resolve();
          }
        })
        .on('error', reject)
        .on('end', resolve);
    });

    // Create table with columns from CSV
    const createTableQuery = `
      CREATE TABLE ${tableName} (
        id SERIAL PRIMARY KEY,
        ${columns.join(',\n        ')}
      )
    `;
    await dbPool.query(createTableQuery);
    console.log(`Created table: ${tableName}`);

    // Insert data from CSV
    let rowCount = 0;
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
            rowCount++;
          } catch (err) {
            reject(err);
          }
        })
        .on('error', reject)
        .on('end', resolve);
    });

    console.log(`Inserted ${rowCount} rows into ${tableName}`);

    // Clean up
    fs.unlinkSync(csvFile.path);
    
    res.status(201).json({
      message: 'Database and table created successfully',
      database: databaseName,
      table: tableName,
      rowsInserted: rowCount
    });

  } catch (error) {
    console.error('Error in database creation process:', error);
    
    // Clean up on error
    if (csvFile && fs.existsSync(csvFile.path)) {
      fs.unlinkSync(csvFile.path);
    }
    
    // If database was created but later steps failed, try to drop it
    if (dbPool && error.message !== `Database "${databaseName}" already exists. Please choose a different name.`) {
      try {
        await dbPool.end();
        await tempPool.query(`DROP DATABASE IF EXISTS ${databaseName}`);
      } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError);
      }
    }

    res.status(400).json({
      error: 'Failed to create database',
      message: error.message
    });

  } finally {
    // Close database connections
    if (dbPool) await dbPool.end();
    if (tempPool) await tempPool.end();
  }
});

module.exports = router; 