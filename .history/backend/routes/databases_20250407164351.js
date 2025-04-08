const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

// Configure multer for file upload
const upload = multer({ dest: 'uploads/' });

// Create a new database and table from CSV
router.post('/', upload.single('csvFile'), async (req, res) => {
  try {
    const { databaseName, tableName } = req.body;
    const csvFile = req.file;

    if (!databaseName || !tableName || !csvFile) {
      return res.status(400).json({ error: 'Database name, table name, and CSV file are required' });
    }

    // Create a new connection pool for the new database
    const newPool = new Pool({
      user: 'postgres',
      host: 'localhost',
      database: 'postgres', // Connect to default database first
      password: 'postgres',
      port: 5432,
    });

    // Create the new database
    await newPool.query(`CREATE DATABASE ${databaseName}`);

    // Connect to the new database
    const dbPool = new Pool({
      user: 'postgres',
      host: 'localhost',
      database: databaseName,
      password: 'postgres',
      port: 5432,
    });

    // Read CSV file and get column names
    const columns = [];
    const firstRow = await new Promise((resolve) => {
      fs.createReadStream(csvFile.path)
        .pipe(csv())
        .on('headers', (headers) => {
          columns.push(...headers);
        })
        .on('data', (data) => {
          resolve(data);
        });
    });

    // Create table with columns from CSV
    const columnDefinitions = columns.map(col => `${col} TEXT`).join(', ');
    await dbPool.query(`CREATE TABLE ${tableName} (${columnDefinitions})`);

    // Insert data from CSV
    const insertPromises = [];
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
      .on('end', async () => {
        try {
          await Promise.all(insertPromises);
          // Clean up uploaded file
          fs.unlinkSync(csvFile.path);
          res.status(201).json({ message: 'Database and table created successfully' });
        } catch (err) {
          console.error('Error inserting data:', err);
          res.status(500).json({ error: 'Error inserting data into table' });
        }
      });

  } catch (err) {
    console.error('Error creating database:', err);
    res.status(500).json({ error: 'Error creating database' });
  }
});

module.exports = router; 