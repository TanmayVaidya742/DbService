const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const csv = require('csv-parser');
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');


// // Ensure uploads directory exists
// const uploadsDir = path.join(__dirname, '../uploads');
// if (!fs.existsSync(uploadsDir)) {
//   fs.mkdirSync(uploadsDir, { recursive: true });
// }

// // Configure multer for file upload
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, uploadsDir);
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + '-' + file.originalname);
//   }
// });

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
// router.post('/', upload.single('csvFile'), async (req, res) => {
//   const { databaseName, tableName } = req.body;
//   const csvFile = req.file;
//   let tempPool = null;
//   let dbPool = null;

//   try {
//     console.log('Received request:', { databaseName, tableName, file: csvFile?.originalname });

//     // Validate required fields
//     if (!databaseName || !tableName || !csvFile) {
//       throw new Error('Database name, table name, and CSV file are required');
//     }

//     // Validate database and table names
//     const nameRegex = /^[a-zA-Z0-9_]+$/;
//     if (!nameRegex.test(databaseName) || !nameRegex.test(tableName)) {
//       throw new Error('Database and table names can only contain letters, numbers, and underscores');
//     }

//     // Connect to postgres database first
//     tempPool = new Pool({
//       user: process.env.DB_USER || 'postgres',
//       host: process.env.DB_HOST || 'localhost',
//       database: 'postgres',
//       password: process.env.DB_PASSWORD || 'pass',
//       port: process.env.DB_PORT || 5432,
//     });

//     // Test connection
//     try {
//       await tempPool.query('SELECT 1');
//       console.log('Successfully connected to PostgreSQL');
//     } catch (err) {
//       console.error('Failed to connect to PostgreSQL:', err);
//       throw new Error('Failed to connect to PostgreSQL: ' + err.message);
//     }

//     // Check if database exists
//     const dbExists = await tempPool.query(
//       "SELECT 1 FROM pg_database WHERE datname = $1",
//       [databaseName]
//     );

//     if (dbExists.rows.length > 0) {
//       console.log(`Database ${databaseName} already exists`);
//       // Database exists, connect to it
//       dbPool = new Pool({
//         user: process.env.DB_USER || 'postgres',
//         host: process.env.DB_HOST || 'localhost',
//         database: databaseName,
//         password: process.env.DB_PASSWORD || 'postgres',
//         port: process.env.DB_PORT || 5432,
//       });

//       // Test connection to existing database
//       try {
//         await dbPool.query('SELECT 1');
//         console.log(`Successfully connected to database ${databaseName}`);
//       } catch (err) {
//         console.error(`Failed to connect to database ${databaseName}:`, err);
//         throw new Error(`Failed to connect to existing database: ${err.message}`);
//       }
//     } else {
//       // Create new database
//       try {
//         await tempPool.query(`CREATE DATABASE ${databaseName}`);
//         console.log(`Created database: ${databaseName}`);
//       } catch (err) {
//         console.error('Error creating database:', err);
//         throw new Error('Failed to create database: ' + err.message);
//       }

//       // Connect to the new database
//       dbPool = new Pool({
//         user: process.env.DB_USER || 'postgres',
//         host: process.env.DB_HOST || 'localhost',
//         database: databaseName,
//         password: process.env.DB_PASSWORD || 'postgres',
//         port: process.env.DB_PORT || 5432,
//       });

//       // Test connection to new database
//       try {
//         await dbPool.query('SELECT 1');
//         console.log(`Successfully connected to new database ${databaseName}`);
//       } catch (err) {
//         console.error(`Failed to connect to new database ${databaseName}:`, err);
//         throw new Error(`Failed to connect to new database: ${err.message}`);
//       }
//     }

//     // Read CSV file to get column names
//     const columns = [];
//     await new Promise((resolve, reject) => {
//       fs.createReadStream(csvFile.path)
//         .pipe(csv())
//         .on('headers', (headers) => {
//           console.log('CSV headers:', headers);
//           headers.forEach(header => {
//             const cleanHeader = header.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
//             columns.push(`${cleanHeader} TEXT`);
//           });
//           resolve();
//         })
//         .on('error', reject);
//     });

//     console.log('Creating table with columns:', columns);

//     // Create table
//     const createTableQuery = `
//       CREATE TABLE IF NOT EXISTS ${tableName} (
//         id SERIAL PRIMARY KEY,
//         ${columns.join(',\n        ')}
//       )
//     `;
//     try {
//       await dbPool.query(createTableQuery);
//       console.log(`Created table: ${tableName}`);
//     } catch (err) {
//       console.error('Error creating table:', err);
//       throw new Error('Failed to create table: ' + err.message);
//     }

//     // Insert data from CSV
//     let insertedRows = 0;
//     await new Promise((resolve, reject) => {
//       fs.createReadStream(csvFile.path)
//         .pipe(csv())
//         .on('data', async (row) => {
//           const columns = Object.keys(row);
//           const values = Object.values(row);
//           const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
          
//           try {
//             await dbPool.query(
//               `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`,
//               values
//             );
//             insertedRows++;
//           } catch (err) {
//             console.error('Error inserting row:', err);
//             reject(err);
//           }
//         })
//         .on('error', reject)
//         .on('end', resolve);
//     });

//     console.log(`Inserted ${insertedRows} rows into ${tableName}`);

//     // Clean up
//     fs.unlinkSync(csvFile.path);
    
//     res.status(201).json({
//       message: 'Database and table created successfully',
//       database: databaseName,
//       table: tableName,
//       rowsInserted: insertedRows
//     });

//   } catch (error) {
//     console.error('Error in database creation process:', error);
    
//     // Clean up on error
//     if (csvFile && fs.existsSync(csvFile.path)) {
//       fs.unlinkSync(csvFile.path);
//     }
    
//     // Send appropriate error response
//     if (error.message.includes('already exists')) {
//       res.status(400).json({
//         error: 'Database already exists',
//         message: error.message
//       });
//     } else if (error.message.includes('Only CSV files are allowed')) {
//       res.status(400).json({
//         error: 'Invalid file type',
//         message: error.message
//       });
//     } else if (error.message.includes('required')) {
//       res.status(400).json({
//         error: 'Missing required fields',
//         message: error.message
//       });
//     } else {
//       res.status(500).json({
//         error: 'Database creation failed',
//         message: error.message
//       });
//     }

//   } finally {
//     // Close database connections
//     if (dbPool) {
//       try {
//         await dbPool.end();
//         console.log('Closed database connection');
//       } catch (err) {
//         console.error('Error closing database connection:', err);
//       }
//     }
//     if (tempPool) {
//       try {
//         await tempPool.end();
//         console.log('Closed temporary connection');
//       } catch (err) {
//         console.error('Error closing temporary connection:', err);
//       }
//     }
//   }
// });

// Utility to sanitize database/table names (remove special chars)
// function sanitizeName(name) {
//   return name.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
// }


// router.post("/", async (req, res) => {
//   const { username } = req.body;

//   if (!username) {
//     return res.status(400).json({ error: "Username is required." });
//   }

//   const sanitized = sanitizeName(username);
//   const dbName = sanitized;
//   const tableName = sanitized;
//   const apiKey = uuidv4();

//   try {
//     // Create new database
//     await pool.query(`CREATE DATABASE ${dbName}`);

//     // Connect to the newly created DB
//     const userDb = new Pool({
//       user: process.env.PGUSER || 'postgres',
//       host: process.env.PGHOST || 'localhost',
//       database: dbName || 'superadmin_db',
//       password: process.env.PGPASSWORD || 'pass',
//       port: process.env.PGPORT || 5432,
//     });

//     // Create a default table in that database
//     await userDb.query(`
//       CREATE TABLE ${tableName} (
//         id UUID PRIMARY KEY,
//         name TEXT,
//         email TEXT,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       )
//     `);

//     // Optional: You can insert a row with the generated API key
//     await userDb.query(`
//       INSERT INTO ${tableName}(id, name, email) VALUES($1, $2, $3)
//     `, [apiKey, username, `${username}@example.com`]);

//     // End the user DB connection
//     await userDb.end();

//     res.status(201).json({
//       message: `Database and table created successfully for ${username}`,
//       database: dbName,
//       table: tableName,
//       apiKey,
//     });
//   } catch (error) {
//     console.error("Error:", error);
//     res.status(500).json({ error: "Failed to create database or table." });
//   }
// });

// Utility to sanitize names for safe SQL usage
function sanitizeName(name) {
  return name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
}

router.post('/init', async (req, res) => {
  const { apiKey } = req.body;

  if (!apiKey) {
    return res.status(400).json({ error: 'API key is required.' });
  }

  const dbName = `db_${sanitizeName(apiKey)}`;
  const tableName = `default_table`;

  let tempPool = null;
  let userDb = null;

  try {
    // 1. Connect to default postgres DB
    // tempPool = new Pool({
    //   user: process.env.PGUSER || 'postgres',
    //   host: process.env.PGHOST || 'localhost',
    //   database: dbName,
    //   password: process.env.PGPASSWORD || 'pass',
    //   port: process.env.PGPORT || 5432,
    // });
    tempPool = new Pool({
      user: process.env.PGUSER || 'postgres',
      host: process.env.PGHOST || 'localhost',
      database: 'postgres', // <-- This!
      password: process.env.PGPASSWORD || 'pass',
      port: process.env.PGPORT || 5432,
    });
    

    // 2. Check if database exists
    const dbExists = await tempPool.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);

    if (dbExists.rowCount === 0) {
      await tempPool.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Created database: ${dbName}`);
    } else {
      console.log(`ℹ️ Database ${dbName} already exists`);
    }

    // 3. Connect to the target DB
    userDb = new Pool({
      user: process.env.PGUSER || 'postgres',
      host: process.env.PGHOST || 'localhost',
      database: dbName,
      password: process.env.PGPASSWORD || 'pass',
      port: process.env.PGPORT || 5432,
    });

    // 4. Create default table (if not exists)
    await userDb.query(`
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id UUID PRIMARY KEY,
        name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 5. Insert a default row
    const id = uuidv4();
    await userDb.query(`
      INSERT INTO ${tableName}(id, name) VALUES ($1, $2)
    `, [id, 'Default entry']);

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
      message: `Database '${dbName}' and table '${tableName}' initialized.`,
      database: dbName,
      table: tableName,
      inserted_id: id
    });

  } catch (err) {
    console.error('❌ Error initializing database:', err);
    res.status(500).json({ error: 'Failed to initialize database/table.' });
  } finally {
    if (tempPool) await tempPool.end();
    if (userDb) await userDb.end();
  }
});
module.exports = router;