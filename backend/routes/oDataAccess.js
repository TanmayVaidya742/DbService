// Fixed GET endpoint implementation with improved error handling and debugging
// Router file: odata-router.js

const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { mainPool } = require('../config/db');
const odataParser = require('odata-query').default;
const cors = require('cors');
const { createFilter, createQuery } = require('odata-v4-sql');

// Enable CORS for all routes
router.use(cors());

// Add debugging middleware to log all requests
router.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  console.log('Query:', JSON.stringify(req.query));
  next();
});

// Middleware to validate API key
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
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Database connection pool manager
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
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    poolCache[dbname].on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      delete poolCache[dbname];
    });
  }

  return poolCache[dbname];
};

// Helper function to parse OData to SQL
// function parseODataToSQL(tableName, odataQuery) {
//   try {
//       const sqlQuery = createQuery(odataQuery);
      
//       let sql = `SELECT ${sqlQuery.select || '*'} FROM "${tableName}"`;
      
//       if (sqlQuery.where) {
//           sql += ` WHERE ${sqlQuery.where}`;
//           // Replace parameters inline (odata-v4-sql uses ? placeholders)
//           sqlQuery.parameters.forEach(param => {
//               sql = sql.replace('?', typeof param === 'string' ? `'${param}'` : param);
//           });
//       }

//       if (sqlQuery.orderby) {
//           sql += ` ORDER BY ${sqlQuery.orderby}`;
//       }

//       if (sqlQuery.limit) {
//           sql += ` LIMIT ${sqlQuery.limit}`;
//       }

//       if (sqlQuery.skip) {
//           sql += ` OFFSET ${sqlQuery.skip}`;
//       }

//       return {
//           sql,
//           parameters: sqlQuery.parameters || []
//       };
//   } catch (err) {
//       throw new Error(`OData parsing error: ${err.message}`);
//   }
// }
// Modified parseODataToSQL function
function parseODataToSQL(tableName, odataQuery) {
    try {
        // Parse the entire OData query
        const ast = createQuery(odataQuery);
        
        // Convert to SQL
        let sql = ast.from || `SELECT * FROM "${tableName}"`;
        
        // Handle $select
        if (ast.select) {
            sql = `SELECT ${ast.select.map(col => `"${col}"`).join(', ')} FROM "${tableName}"`;
        }
        
        // Handle $filter
        if (ast.where) {
            const filterSql = createFilter(ast.where);
            sql += ` WHERE ${filterSql.sql}`;
            // Replace parameters
            filterSql.params.forEach((param, index) => {
                sql = sql.replace(`@p${index}`, typeof param === 'string' ? `'${param}'` : param);
            });
        }
        
        // Handle $orderby
        if (ast.orderBy) {
            sql += ` ORDER BY ${ast.orderBy.map(item => `"${item.field}" ${item.dir}`).join(', ')}`;
        }
        
        // Handle $top (LIMIT)
        if (ast.limit) {
            sql += ` LIMIT ${ast.limit}`;
        }
        
        // Handle $skip (OFFSET)
        if (ast.skip) {
            sql += ` OFFSET ${ast.skip}`;
        }
        
        return {
            sql,
            parameters: []
        };
    } catch (err) {
        throw new Error(`OData parsing error: ${err.message}`);
    }
}

// Example request object for batch operations
const batchRequest = {
  "operations": [
    {
      "type": "select",
      "table": "users",
      "columns": ["id", "name", "email"],
      "where": {
        "active": true
      },
      "orderby": {
        "created_at": "desc"
      },
      "limit": 10
    },
    {
      "type": "select",
      "table": "products",
      "where": {
        "category": "electronics",
        "price": {
          "gt": 100,
          "lt": 500
        }
      }
    },
    {
      "type": "odata",
      "table": "orders",
      "query": {
        "$filter": "status eq 'pending' and total gt 50",
        "$orderby": "created_at desc",
        "$top": 5
      }
    }
  ]
}

// Example of how to call the batch API endpoint using fetch
async function executeBatchOperations(dbName, apiKey) {
  const response = await fetch(`/api/odata/${dbName}/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey
    },
    body: JSON.stringify(batchRequest)
  });
  
  const result = await response.json();
  console.log('Batch operations result:', result);
  
  // Process individual results
  result.results.forEach((operationResult, index) => {
    console.log(`Operation ${index} (${operationResult.type} on ${operationResult.table}):`);
    console.log(`- Found ${operationResult.data.count} records`);
    console.log('- Data:', operationResult.data.data);
  });
  
  return result;
}

// Helper function to get table columns
const getTableColumns = async (pool, tableName) => {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = $1
      AND table_schema = 'public'
    `, [tableName]);
    
    return result.rows;
  } catch (err) {
    console.error(`Error getting columns for table ${tableName}:`, err);
    throw new Error(`Cannot get columns for table ${tableName}: ${err.message}`);
  }
};

// ========== IMPROVED DIRECT FILTER PARSING ==========

// Function to directly handle common filter patterns
const parseDirectFilter = (filterStr) => {
  if (!filterStr) return null;
  
  try {
    console.log(`Parsing direct filter: ${filterStr}`);
    
    // Handle startswith
    if (filterStr.toLowerCase().includes('startswith')) {
      const match = /startswith\((\w+),\s*'([^']+)'\)/i.exec(filterStr);
      if (match) {
        const [_, fieldName, searchValue] = match;
        return {
          type: 'startswith',
          fieldName,
          value: searchValue
        };
      }
    }
    
    // Handle contains
    if (filterStr.toLowerCase().includes('contains')) {
      const match = /contains\((\w+),\s*'([^']+)'\)/i.exec(filterStr);
      if (match) {
        const [_, fieldName, searchValue] = match;
        return {
          type: 'contains',
          fieldName,
          value: searchValue
        };
      }
    }
    
    // Handle endswith
    if (filterStr.toLowerCase().includes('endswith')) {
      const match = /endswith\((\w+),\s*'([^']+)'\)/i.exec(filterStr);
      if (match) {
        const [_, fieldName, searchValue] = match;
        return {
          type: 'endswith',
          fieldName,
          value: searchValue
        };
      }
    }
    
    // Handle basic equality
    if (filterStr.includes(' eq ')) {
      const [fieldName, value] = filterStr.split(' eq ');
      let cleanValue = value.trim().replace(/^'|'$/g, ''); // Remove surrounding quotes
      return {
        type: 'eq',
        fieldName: fieldName.trim(),
        value: cleanValue
      };
    }
    
    // Handle gt operator
    if (filterStr.includes(' gt ')) {
      const [fieldName, value] = filterStr.split(' gt ');
      let cleanValue = value.trim().replace(/^'|'$/g, ''); // Remove surrounding quotes
      return {
        type: 'gt',
        fieldName: fieldName.trim(),
        value: cleanValue
      };
    }
    
    // Handle lt operator
    if (filterStr.includes(' lt ')) {
      const [fieldName, value] = filterStr.split(' lt ');
      let cleanValue = value.trim().replace(/^'|'$/g, ''); // Remove surrounding quotes
      return {
        type: 'lt',
        fieldName: fieldName.trim(),
        value: cleanValue
      };
    }
    
    // Handle le operator
    if (filterStr.includes(' le ')) {
      const [fieldName, value] = filterStr.split(' le ');
      let cleanValue = value.trim().replace(/^'|'$/g, ''); // Remove surrounding quotes
      return {
        type: 'le',
        fieldName: fieldName.trim(),
        value: cleanValue
      };
    }
    
    // Handle ge operator
    if (filterStr.includes(' ge ')) {
      const [fieldName, value] = filterStr.split(' ge ');
      let cleanValue = value.trim().replace(/^'|'$/g, ''); // Remove surrounding quotes
      return {
        type: 'ge',
        fieldName: fieldName.trim(),
        value: cleanValue
      };
    }
    
    // Handle ne operator
    if (filterStr.includes(' ne ')) {
      const [fieldName, value] = filterStr.split(' ne ');
      let cleanValue = value.trim().replace(/^'|'$/g, ''); // Remove surrounding quotes
      return {
        type: 'ne',
        fieldName: fieldName.trim(),
        value: cleanValue
      };
    }
    
    console.log('Could not directly parse filter');
    return null;
  } catch (err) {
    console.error('Error in direct filter parsing:', err);
    return null;
  }
};

// Direct SQL generation for common filter patterns
const generateDirectFilterSQL = (tableName, filter) => {
  if (!filter) return null;
  
  const params = [];
  let whereClause = '';
  
  switch (filter.type) {
    case 'startswith':
      params.push(`${filter.value}%`);
      whereClause = `"${filter.fieldName}" ILIKE $1`;
      break;
      
    case 'contains':
      params.push(`%${filter.value}%`);
      whereClause = `"${filter.fieldName}" ILIKE $1`;
      break;
      
    case 'endswith':
      params.push(`%${filter.value}`);
      whereClause = `"${filter.fieldName}" ILIKE $1`;
      break;
      
    case 'eq':
      params.push(filter.value);
      whereClause = `"${filter.fieldName}" = $1`;
      break;
      
    case 'gt':
      params.push(filter.value);
      whereClause = `"${filter.fieldName}" > $1`;
      break;
      
    case 'lt':
      params.push(filter.value);
      whereClause = `"${filter.fieldName}" < $1`;
      break;
      
    case 'ge':
      params.push(filter.value);
      whereClause = `"${filter.fieldName}" >= $1`;
      break;
      
    case 'le':
      params.push(filter.value);
      whereClause = `"${filter.fieldName}" <= $1`;
      break;
      
    case 'ne':
      params.push(filter.value);
      whereClause = `"${filter.fieldName}" != $1`;
      break;
      
    default:
      return null;
  }
  
  const query = `SELECT * FROM "${tableName}" WHERE ${whereClause}`;
  console.log('Generated direct SQL:', query);
  console.log('With params:', params);
  return { query, params };
};


const convertODataToSQL = async (pool, tableName, odataQuery = {}) => {
  try {
    console.log('==== STARTING ODATA TO SQL CONVERSION ====');
    console.log('OData query object:', JSON.stringify(odataQuery, null, 2));
    
    // Sanitize table name
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      throw new Error('Invalid table name');
    }
    
    let baseQuery = `SELECT * FROM "${tableName}"`;
    const params = [];
    let paramCount = 1;
    
    console.log(`[DEBUG] Initial base query: ${baseQuery}`);
    
    // Get table columns for validation
    console.log(`[DEBUG] Fetching columns for table: ${tableName}`);
    const tableColumns = await getTableColumns(pool, tableName);
    if (!tableColumns || tableColumns.length === 0) {
      throw new Error(`Table '${tableName}' does not exist or has no columns`);
    }
    
    const columnNames = tableColumns.map(c => c.column_name);
    console.log(`[DEBUG] Table columns found:`, columnNames);

    const operatorMap = {
      'eq': '=', 'ne': '!=', 'lt': '<', 'le': '<=', 'gt': '>', 'ge': '>=',
      'and': 'AND', 'or': 'OR', 'not': 'NOT', 'has': '@>', 'in': 'IN'
    };

    // [Previous function implementations remain the same...]

    // Process $orderby with enhanced debugging
    if (odataQuery.orderby?.length > 0) {
      console.log(`[DEBUG] Processing $orderby clause:`, odataQuery.orderby);
      
      try {
        const orderByClauses = [];
        
        for (const [index, order] of odataQuery.orderby.entries()) {
          console.log(`[DEBUG] Processing orderby item ${index + 1}:`, order);
          
          // Validate direction
          const direction = (order.dir || 'asc').toLowerCase();
          console.log(`[DEBUG] Order direction: ${direction}`);
          
          if (!['asc', 'desc'].includes(direction)) {
            throw new Error(`Invalid order direction: ${direction}`);
          }
          
          // Find matching column (case insensitive)
          console.log(`[DEBUG] Looking for column: ${order.field}`);
          const matchingColumn = columnNames.find(c => 
            c.toLowerCase() === order.field.toLowerCase()
          );
          
          if (!matchingColumn) {
            console.error(`[ERROR] Column '${order.field}' not found in table. Available columns:`, columnNames);
            throw new Error(`Column '${order.field}' not found in table`);
          }
          
          console.log(`[DEBUG] Found matching column: ${matchingColumn}`);
          
          // Handle nulls ordering if specified
          const nulls = order.nulls ? ` NULLS ${order.nulls}` : '';
          console.log(`[DEBUG] Nulls ordering: ${nulls || 'default'}`);
          
          orderByClauses.push(`"${matchingColumn}" ${direction}${nulls}`);
          console.log(`[DEBUG] Current orderByClauses:`, orderByClauses);
        }
        
        if (orderByClauses.length > 0) {
          const orderByString = orderByClauses.join(', ');
          baseQuery += ` ORDER BY ${orderByString}`;
          console.log(`[DEBUG] Added ORDER BY clause: ${orderByString}`);
          console.log(`[DEBUG] Query after ORDER BY: ${baseQuery}`);
        }
      } catch (err) {
        console.error('[ERROR] Error processing orderby:', err);
        throw new Error(`Invalid orderby clause: ${err.message}`);
      }
    } else {
      console.log('[DEBUG] No $orderby clause present');
    }

    // [Rest of your existing code...]

    console.log('==== FINAL SQL QUERY ====');
    console.log('Generated SQL:', baseQuery);
    console.log('With params:', params);
    console.log('=========================');
    
    return { query: baseQuery, params };
  } catch (err) {
    console.error('==== CONVERSION FAILED ====');
    console.error('Error converting OData to SQL:', err);
    throw new Error(`Invalid OData query: ${err.message}`);
  }
};  

// Add this temporary test endpoint
router.get('/test-orderby/:dbname/:tablename', validateApiKey, async (req, res) => {
  const { dbname, tablename } = req.params;
  const pool = getDbPool(dbname);
  
  // Manually test orderby with known column
  const result = await pool.query(`SELECT * FROM "${tablename}" ORDER BY id DESC LIMIT 5`);
  res.json(result.rows);
});

// ========== IMPROVED ENDPOINTS ==========

// GET endpoint with enhanced error handling
// router.get('/:dbname/:tablename', validateApiKey, async (req, res) => {
//   const { dbname, tablename } = req.params;
  
//   try {
//     // Validate database and table name
//     if (!/^[a-zA-Z0-9_]+$/.test(dbname)) {
//       return res.status(400).json({ error: 'Invalid database name' });
//     }
    
//     if (!/^[a-zA-Z0-9_]+$/.test(tablename)) {
//       return res.status(400).json({ error: 'Invalid table name' });
//     }
    
//     const pool = getDbPool(dbname);
    
//     // Check if table exists
//     try {
//       const tableCheck = await pool.query(`
//         SELECT EXISTS (
//           SELECT FROM information_schema.tables 
//           WHERE table_schema = 'public' 
//           AND table_name = $1
//         )`, [tableName]);
      
//       if (!tableCheck.rows[0].exists) {
//         return res.status(404).json({ error: `Table '${tableName}' not found` });
//       }
//     } catch (tableErr) {
//       console.error('Error checking table existence:', tableErr);
//     }
    
//     // Handle empty query case
//     if (Object.keys(req.query).length === 0) {
//       const result = await pool.query(`SELECT * FROM "${tablename}" LIMIT 100`);
//       return res.status(200).json({
//         '@odata.context': `$metadata#${tablename}`,
//         '@odata.count': result.rows.length,
//         value: result.rows
//       });
//     }
    
//     // Try direct filter parsing for simple cases
//     if (req.query.$filter) {
//       const directFilter = parseDirectFilter(req.query.$filter);
      
//       if (directFilter) {
//         const sqlResult = generateDirectFilterSQL(tablename, directFilter);
        
//         if (sqlResult) {
//           try {
//             const result = await pool.query(sqlResult.query, sqlResult.params);
            
//             return res.status(200).json({
//               '@odata.context': `$metadata#${tablename}`,
//               '@odata.count': result.rows.length,
//               value: result.rows
//             });
//           } catch (directQueryErr) {
//             console.error('Error executing direct query:', directQueryErr);
//             // Continue to full OData parser if direct query fails
//           }
//         }
//       }
//     }
    
//     // Parse OData query
//     let odataQuery;
//     try {
//       odataQuery = odataParser(req.query);
//       console.log('Parsed OData query:', JSON.stringify(odataQuery, null, 2));
//     } catch (parseErr) {
//       console.error('OData parsing error:', parseErr);
//       return res.status(400).json({ 
//         error: 'Invalid OData query',
//         details: parseErr.message 
//       });
//     }
    
//     const { query, params } = await convertODataToSQL(pool, tablename, odataQuery);
    
//     try {
//       const result = await pool.query(query, params);
      
//       const response = {
//         '@odata.context': `$metadata#${tablename}`,
//         '@odata.count': result.rows.length,
//         value: result.rows
//       };
      
//       if (req.query.$count === 'true') {
//         response['@odata.count'] = result.rows[0]?.count || 0;
//       }
      
//       res.status(200).json(response);
//     } catch (queryErr) {
//       console.error('Error executing SQL query:', queryErr);
//       res.status(500).json({ 
//         error: 'Database query error',
//         details: queryErr.message,
//         query: query,
//         params: params
//       });
//     }
//   } catch (err) {
//     console.error('Error in GET OData:', err);
//     let errorMessage = err.message;
//     let status = 500;
    
//     if (err.message.includes('Invalid')) {
//       status = 400;
//     } else if (err.message.includes('relation') && err.message.includes('does not exist')) {
//       status = 404;
//       errorMessage = `Table '${tablename}' not found`;
//     } else if (err.message.includes('column') && err.message.includes('does not exist')) {
//       status = 400;
//       errorMessage = `Invalid column name in query`;
//     }
    
//     res.status(status).json({ 
//       error: 'Query error',
//       details: errorMessage
//     });
//   }
// });




// router.get('/:dbname/:tablename', validateApiKey, async (req, res) => {
//   const { dbname, tablename } = req.params;
//   const {
//     $select,
//     $filter,
//     $orderby,
//     $top,
//     $skip,
//     $count,
//     $expand
//   } = req.query;

//   try {
//     // Validate database and table names
//     if (!/^[a-zA-Z0-9_]+$/.test(dbname)) {
//       return res.status(400).json({ error: 'Invalid database name' });
//     }
    
//     if (!/^[a-zA-Z0-9_]+$/.test(tablename)) {
//       return res.status(400).json({ error: 'Invalid table name' });
//     }

//     const pool = getDbPool(dbname);

//     // Check if table exists
//     const tableExists = await pool.query(
//       `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1)`,
//       [tablename]
//     );
    
//     if (!tableExists.rows[0].exists) {
//       return res.status(404).json({ error: `Table '${tablename}' not found` });
//     }

//     // Get table columns for validation
//     const tableColumns = await getTableColumns(pool, tablename);
//     const columnNames = tableColumns.map(c => c.column_name);

//     // Build SELECT clause
//     let selectClause = '*';
//     if ($select) {
//       const selectedColumns = $select.split(',').map(col => col.trim());
//       const invalidColumns = selectedColumns.filter(col => !columnNames.includes(col));
      
//       if (invalidColumns.length > 0) {
//         return res.status(400).json({
//           error: 'Invalid column names in $select',
//           invalidColumns,
//           availableColumns: columnNames
//         });
//       }
//       selectClause = selectedColumns.map(col => `"${col}"`).join(', ');
//     }

//     // Build WHERE clause from $filter
//     let whereClause = '';
//     const params = [];
    
//     if ($filter) {
//       try {
//         const filterParts = [];
//         const filterGroups = $filter.split(/( and | or )/i);
        
//         let currentLogicalOp = 'AND';
//         for (const group of filterGroups) {
//           if (group.match(/ and /i)) {
//             currentLogicalOp = 'AND';
//             continue;
//           } else if (group.match(/ or /i)) {
//             currentLogicalOp = 'OR';
//             continue;
//           }

//           const operatorMatch = group.match(/(\w+)\s+(eq|ne|gt|ge|lt|le|like)\s+(['"].*?['"]|\d+)/i);
//           if (operatorMatch) {
//             const [_, column, operator, value] = operatorMatch;
            
//             if (!columnNames.includes(column)) {
//               return res.status(400).json({
//                 error: `Column '${column}' not found in $filter`,
//                 availableColumns: columnNames
//               });
//             }

//             const paramIndex = params.length + 1;
//             let sqlOperator;
//             let paramValue = value.replace(/^['"]|['"]$/g, ''); // Remove quotes
            
//             switch (operator.toLowerCase()) {
//               case 'eq': sqlOperator = '='; break;
//               case 'ne': sqlOperator = '!='; break;
//               case 'gt': sqlOperator = '>'; break;
//               case 'ge': sqlOperator = '>='; break;
//               case 'lt': sqlOperator = '<'; break;
//               case 'le': sqlOperator = '<='; break;
//               case 'like': sqlOperator = 'LIKE'; break;
//               default: 
//                 return res.status(400).json({ error: `Unsupported operator '${operator}' in $filter` });
//             }

//             // Handle numeric values
//             if (!isNaN(paramValue)) {
//               paramValue = parseFloat(paramValue);
//             }

//             params.push(paramValue);
//             filterParts.push(`"${column}" ${sqlOperator} $${paramIndex}`);
//           } else {
//             return res.status(400).json({ error: 'Invalid $filter syntax' });
//           }
//         }

//         if (filterParts.length > 0) {
//           whereClause = ` WHERE ${filterParts.join(` ${currentLogicalOp} `)}`;
//         }
//       } catch (err) {
//         return res.status(400).json({ error: 'Invalid $filter parameter', details: err.message });
//       }
//     }

//     // Build ORDER BY clause
//     let orderByClause = '';
//     if ($orderby) {
//       try {
//         const orderParts = $orderby.split(',').map(part => {
//           const [column, direction] = part.trim().split(/\s+/);
//           if (!columnNames.includes(column)) {
//             throw new Error(`Column '${column}' not found`);
//           }
//           const dir = direction && direction.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
//           return `"${column}" ${dir}`;
//         });
        
//         orderByClause = ` ORDER BY ${orderParts.join(', ')}`;
//       } catch (err) {
//         return res.status(400).json({ 
//           error: 'Invalid $orderby parameter',
//           details: err.message,
//           availableColumns: columnNames
//         });
//       }
//     }

//     // Build LIMIT/OFFSET clauses
//     let limitOffsetClause = '';
//     if ($top) {
//       const topNum = parseInt($top);
//       if (!isNaN(topNum) && topNum > 0) {
//         limitOffsetClause = ` LIMIT ${topNum}`;
        
//         if ($skip) {
//           const skipNum = parseInt($skip);
//           if (!isNaN(skipNum) && skipNum >= 0) {
//             limitOffsetClause += ` OFFSET ${skipNum}`;
//           }
//         }
//       }
//     }

//     // Construct final query
//     const query = `SELECT ${selectClause} FROM "${tablename}"${whereClause}${orderByClause}${limitOffsetClause}`;
    
//     console.log('Executing query:', query);
//     console.log('With parameters:', params);

//     // Execute query
//     const result = await pool.query(query, params);

//     // Prepare response
//     const response = {
//       "@odata.context": `$metadata#${tablename}`,
//       value: result.rows
//     };

//     // Add count if requested
//     if ($count === 'true') {
//       const countResult = await pool.query(`SELECT COUNT(*) FROM "${tablename}"${whereClause}`, params);
//       response["@odata.count"] = parseInt(countResult.rows[0].count);
//     }

//     res.status(200).json(response);

//   } catch (err) {
//     console.error('Error:', err);
//     let status = 500;
//     let errorMessage = err.message;
    
//     if (err.message.includes('relation') && err.message.includes('does not exist')) {
//       status = 404;
//       errorMessage = `Table '${tablename}' not found`;
//     } else if (err.message.includes('column') && err.message.includes('does not exist')) {
//       status = 400;
//       errorMessage = `Invalid column name in query`;
//     } else if (err.message.includes('syntax error')) {
//       status = 400;
//       errorMessage = `Invalid query syntax`;
//     }
    
//     res.status(status).json({ 
//       success: false,
//       error: errorMessage,
//       details: process.env.NODE_ENV === 'development' ? err.message : undefined
//     });
//   }
// });

router.get('/:dbname/:tablename', validateApiKey, async (req, res) => {
  const { dbname, tablename } = req.params;
  const {
    $select,    // Select specific columns
    $filter,    // Filter conditions
    $orderby,   // Sorting
    $top,       // Limit (pagination)
    $skip,      // Offset (pagination)
    $count,     // Include total count
    $expand,    // Related entities (not implemented here)
    $search     // Full-text search (not implemented here)
  } = req.query;

  // Validate database and table names
  if (!/^[a-zA-Z0-9_]+$/.test(dbname)) {
    return res.status(400).json({ 
      success: false,
      error: 'Invalid database name',
      details: 'Database name can only contain letters, numbers and underscores'
    });
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(tablename)) {
    return res.status(400).json({ 
      success: false,
      error: 'Invalid table name',
      details: 'Table name can only contain letters, numbers and underscores'
    });
  }

  try {
    const pool = getDbPool(dbname);

    // Check if table exists
    const tableExists = await pool.query(
      `SELECT EXISTS (SELECT FROM information_schema.tables 
       WHERE table_schema = 'public' AND table_name = $1)`,
      [tablename]
    );
    
    if (!tableExists.rows[0].exists) {
      return res.status(404).json({ 
        success: false,
        error: `Table '${tablename}' not found`,
        details: `The requested table does not exist in database '${dbname}'`
      });
    }

    // Get table metadata for validation
    const { columns, primaryKey } = await getTableMetadata(pool, tablename);
    const columnNames = columns.map(c => c.name);

    // Build SELECT clause with parameterized validation
    let selectClause = '*';
    if ($select) {
      const selectedColumns = $select.split(',').map(col => col.trim());
      const invalidColumns = selectedColumns.filter(col => !columnNames.includes(col));
      
      if (invalidColumns.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid column names in $select',
          invalidColumns,
          availableColumns: columnNames,
          details: `The following columns are not valid: ${invalidColumns.join(', ')}`
        });
      }
      selectClause = selectedColumns.map(col => `"${col}"`).join(', ');
    }

    // Build WHERE clause with advanced filtering
    let whereClause = '';
    const filterParams = [];
    
    if ($filter) {
      try {
        const { where, params } = buildWhereClause($filter, columnNames);
        whereClause = where;
        filterParams.push(...params);
      } catch (err) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid $filter parameter',
          details: err.message,
          example: "Try format like: 'name eq \"John\" and age gt 18'"
        });
      }
    }

    // Build ORDER BY clause with validation
    let orderByClause = '';
    if ($orderby) {
      try {
        orderByClause = buildOrderByClause($orderby, columnNames);
      } catch (err) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid $orderby parameter',
          details: err.message,
          example: "Try format like: 'name asc, age desc'"
        });
      }
    }

    // Build pagination (LIMIT/OFFSET)
    let paginationClause = '';
    let topValue = parseInt($top);
    let skipValue = parseInt($skip);
    
    if (!isNaN(topValue) && topValue > 0) {
      paginationClause = ` LIMIT ${topValue}`;
      if (!isNaN(skipValue) && skipValue >= 0) {
        paginationClause += ` OFFSET ${skipValue}`;
      }
    }

    // Construct final parameterized query
    const query = {
      text: `SELECT ${selectClause} FROM "${tablename}"${whereClause}${orderByClause}${paginationClause}`,
      values: filterParams
    };

    console.debug('Executing query:', query.text, 'with params:', query.values);

    // Execute query
    const result = await pool.query(query);

    // Prepare OData-style response
    const response = {
      "@odata.context": `$metadata#${tablename}`,
      value: result.rows
    };

    // Include count if requested
    if ($count === 'true') {
      const countQuery = {
        text: `SELECT COUNT(*) FROM "${tablename}"${whereClause}`,
        values: filterParams
      };
      const countResult = await pool.query(countQuery);
      response["@odata.count"] = parseInt(countResult.rows[0].count);
    }

    res.status(200).json({
      success: true,
      ...response,
      query: process.env.NODE_ENV === 'development' ? query : undefined
    });

  } catch (err) {
    console.error('Database error:', err);
    
    const errorResponse = {
      success: false,
      error: 'Database operation failed',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    };

    if (err.message.includes('does not exist')) {
      if (err.message.includes('relation')) {
        errorResponse.error = `Table '${tablename}' not found`;
        res.status(404);
      } else if (err.message.includes('column')) {
        errorResponse.error = 'Invalid column reference';
        res.status(400);
      }
    } else if (err.message.includes('syntax error')) {
      errorResponse.error = 'Invalid query syntax';
      res.status(400);
    } else {
      res.status(500);
    }

    res.json(errorResponse);
  }
});

// Helper function to parse filter clauses
function buildWhereClause(filterString, validColumns) {
  const conditions = [];
  const params = [];
  let paramIndex = 1;

  // Convert OData filter to SQL WHERE clause
  // Example: "name eq 'John' and age gt 30" -> "name = $1 AND age > $2"
  const tokens = filterString.split(/( and | or |\(|\))/i)
    .filter(token => token.trim().length > 0);

  let currentLogicalOp = 'AND';
  
  for (const token of tokens) {
    if (token.match(/ and /i)) {
      currentLogicalOp = 'AND';
      continue;
    } else if (token.match(/ or /i)) {
      currentLogicalOp = 'OR';
      continue;
    } else if (token === '(' || token === ')') {
      conditions.push(token);
      continue;
    }

    const match = token.match(/(\w+)\s+(eq|ne|gt|ge|lt|le|like|in)\s+(.*)/i);
    if (!match) {
      throw new Error(`Invalid filter expression: ${token}`);
    }

    const [_, column, operator, value] = match;
    
    if (!validColumns.includes(column)) {
      throw new Error(`Invalid column '${column}' in filter`);
    }

    let sqlOperator;
    switch (operator.toLowerCase()) {
      case 'eq': sqlOperator = '='; break;
      case 'ne': sqlOperator = '!='; break;
      case 'gt': sqlOperator = '>'; break;
      case 'ge': sqlOperator = '>='; break;
      case 'lt': sqlOperator = '<'; break;
      case 'le': sqlOperator = '<='; break;
      case 'like': sqlOperator = 'LIKE'; break;
      case 'in': sqlOperator = 'IN'; break;
      default:
        throw new Error(`Unsupported operator '${operator}'`);
    }

    let paramValue;
    if (operator.toLowerCase() === 'in') {
      // Handle IN clause (e.g., "id in (1,2,3)")
      const values = value.replace(/[()]/g, '').split(',')
        .map(v => v.trim().replace(/^['"]|['"]$/g, ''));
      paramValue = values;
      params.push(...values);
      conditions.push(`"${column}" ${sqlOperator} (${values.map((_, i) => `$${paramIndex + i}`).join(',')})`);
      paramIndex += values.length;
    } else {
      // Handle normal values
      paramValue = value.replace(/^['"]|['"]$/g, '');
      if (!isNaN(paramValue)) paramValue = parseFloat(paramValue);
      params.push(paramValue);
      conditions.push(`"${column}" ${sqlOperator} $${paramIndex}`);
      paramIndex++;
    }
  }

  return {
    where: conditions.length > 0 ? ` WHERE ${conditions.join(' ')}` : '',
    params
  };
}

// Helper function to build ORDER BY clause
function buildOrderByClause(orderbyString, validColumns) {
  return orderbyString.split(',')
    .map(part => {
      const [column, direction] = part.trim().split(/\s+/);
      if (!validColumns.includes(column)) {
        throw new Error(`Invalid column '${column}' in orderby`);
      }
      const dir = direction && direction.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
      return `"${column}" ${dir}`;
    })
    .join(', ');
}

// Helper function to get table metadata
async function getTableMetadata(pool, tableName) {
  const columns = await pool.query(`
    SELECT column_name as name, data_type as type 
    FROM information_schema.columns 
    WHERE table_name = $1
  `, [tableName]);

  const primaryKey = await pool.query(`
    SELECT column_name 
    FROM information_schema.key_column_usage
    WHERE table_name = $1
  `, [tableName]);

  return {
    columns: columns.rows,
    primaryKey: primaryKey.rows[0]?.column_name
  };
}






// Update the select endpoint to handle $filter
// router.get('/:dbname/:tablename/select', validateApiKey, async (req, res) => {
//   const { dbname, tablename } = req.params;
  
//   try {
//     // Validate database and table name
//     if (!/^[a-zA-Z0-9_]+$/.test(dbname)) {
//       return res.status(400).json({ error: 'Invalid database name' });
//     }
    
//     if (!/^[a-zA-Z0-9_]+$/.test(tablename)) {
//       return res.status(400).json({ error: 'Invalid table name' });
//     }

//     const pool = getDbPool(dbname);

//     // Check if table exists
//     const tableExists = await pool.query(
//       `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1)`,
//       [tablename]
//     );
    
//     if (!tableExists.rows[0].exists) {
//       return res.status(404).json({ error: `Table '${tablename}' not found` });
//     }

//     // Get query parameters from URL
//     const { 
//       columns, 
//       where, 
//       orderby, 
//       limit, 
//       offset,
//       $filter  // Add OData filter parameter
//     } = req.query;

//     // Get table columns for validation
//     const tableColumns = await getTableColumns(pool, tablename);
//     const columnNames = tableColumns.map(c => c.column_name);

//     // Build SELECT clause
//     let selectClause = '*';
//     if (columns) {
//       try {
//         const columnList = JSON.parse(columns);
//         if (Array.isArray(columnList)) {
//           // Validate requested columns exist
//           const invalidColumns = columnList.filter(col => !columnNames.includes(col));
//           if (invalidColumns.length > 0) {
//             return res.status(400).json({
//               error: 'Invalid column names',
//               invalidColumns,
//               availableColumns: columnNames
//             });
//           }
//           selectClause = columnList.map(col => `"${col}"`).join(', ');
//         }
//       } catch (e) {
//         return res.status(400).json({ error: 'Invalid columns parameter - must be JSON array' });
//       }
//     }

//     // Build WHERE clause - handle both regular where and OData $filter
//     let whereClause = '';
//     const params = [];
//     let paramIndex = 1;

//     // Process OData $filter if present
//     if ($filter) {
//       const directFilter = parseDirectFilter($filter);
      
//       if (directFilter) {
//         const sqlResult = generateDirectFilterSQL(tablename, directFilter);
        
//         if (sqlResult) {
//           whereClause = ` WHERE ${sqlResult.query.split('WHERE')[1]}`;
//           params.push(...sqlResult.params);
//           paramIndex += sqlResult.params.length;
//         }
//       }
//     }

//     // Process regular where parameter if present
//     if (where && !whereClause) {
//       try {
//         const whereObj = JSON.parse(where);
//         if (typeof whereObj === 'object' && whereObj !== null) {
//           const whereParts = [];

//           for (const [column, value] of Object.entries(whereObj)) {
//             if (!columnNames.includes(column)) {
//               return res.status(400).json({
//                 error: `Column '${column}' not found in table`,
//                 availableColumns: columnNames
//               });
//             }

//             if (Array.isArray(value)) {
//               // Handle IN clause
//               whereParts.push(`"${column}" IN (${value.map((_, i) => `$${paramIndex + i}`).join(', ')})`);
//               params.push(...value);
//               paramIndex += value.length;
//             } else {
//               // Handle equality
//               whereParts.push(`"${column}" = $${paramIndex}`);
//               params.push(value);
//               paramIndex++;
//             }
//           }

//           if (whereParts.length > 0) {
//             whereClause = ` WHERE ${whereParts.join(' AND ')}`;
//           }
//         }
//       } catch (e) {
//         return res.status(400).json({ error: 'Invalid where parameter - must be JSON object' });
//       }
//     }

//     // Rest of the code remains the same...
//     // Build ORDER BY clause
//     let orderByClause = '';
//     if (orderby) {
//       try {
//         const orderByObj = JSON.parse(orderby);
//         if (typeof orderByObj === 'object' && orderByObj !== null) {
//           const orderParts = [];
          
//           for (const [column, direction] of Object.entries(orderByObj)) {
//             if (!columnNames.includes(column)) {
//               return res.status(400).json({
//                 error: `Column '${column}' not found in table`,
//                 availableColumns: columnNames
//               });
//             }

//             const dir = String(direction).toLowerCase() === 'desc' ? 'DESC' : 'ASC';
//             orderParts.push(`"${column}" ${dir}`);
//           }

//           if (orderParts.length > 0) {
//             orderByClause = ` ORDER BY ${orderParts.join(', ')}`;
//           }
//         }
//       } catch (e) {
//         return res.status(400).json({ error: 'Invalid orderby parameter - must be JSON object' });
//       }
//     }

//     // Build LIMIT/OFFSET clauses
//     let limitOffsetClause = '';
//     if (limit) {
//       const limitNum = parseInt(limit);
//       if (!isNaN(limitNum) && limitNum > 0) {
//         limitOffsetClause = ` LIMIT ${limitNum}`;
        
//         if (offset) {
//           const offsetNum = parseInt(offset);
//           if (!isNaN(offsetNum) && offsetNum >= 0) {
//             limitOffsetClause += ` OFFSET ${offsetNum}`;
//           }
//         }
//       }
//     }

//     // Construct final query
//     const query = `SELECT ${selectClause} FROM "${tablename}"${whereClause}${orderByClause}${limitOffsetClause}`;
    
//     console.log('Generated SELECT query:', query);
//     console.log('With parameters:', params);

//     // Execute query
//     const result = await pool.query(query, params);

//     res.status(200).json({
//       success: true,
//       query: query,
//       parameters: params,
//       count: result.rows.length,
//       data: result.rows
//     });

//   } catch (err) {
//     console.error('Error in SELECT API:', err);
    
//     let status = 500;
//     let errorMessage = err.message;
    
//     if (err.message.includes('relation') && err.message.includes('does not exist')) {
//       status = 404;
//       errorMessage = `Table '${tablename}' not found`;
//     } else if (err.message.includes('column') && err.message.includes('does not exist')) {
//       status = 400;
//       errorMessage = `Invalid column name in query`;
//     } else if (err.message.includes('syntax error')) {
//       status = 400;
//       errorMessage = `Invalid query syntax`;
//     }
    
//     res.status(status).json({ 
//       success: false,
//       error: errorMessage,
//       details: process.env.NODE_ENV === 'development' ? err.stack : undefined
//     });
//   }
// });
// Updated SELECT endpoint with OData support
// router.get('/:dbname/:tablename/select', validateApiKey, async (req, res) => {
//   const { dbname, tablename } = req.params;

//   try {
//       // Validate database and table name
//       if (!/^[a-zA-Z0-9_]+$/.test(dbname)) {
//           return res.status(400).json({ error: 'Invalid database name' });
//       }
      
//       if (!/^[a-zA-Z0-9_]+$/.test(tablename)) {
//           return res.status(400).json({ error: 'Invalid table name' });
//       }

//       const pool = getDbPool(dbname);

//       // Check if table exists
//       const tableExists = await pool.query(
//           `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1)`,
//           [tablename]
//       );
      
//       if (!tableExists.rows[0].exists) {
//           return res.status(404).json({ error: `Table '${tablename}' not found` });
//       }

//       // Get all query parameters
//       const queryParams = req.query;
      
//       // Check if this is an OData request
//       const isODataRequest = Object.keys(queryParams).some(key => key.startsWith('$'));
      
//       let query, params = [];
      
//       if (isODataRequest) {
//           // Handle OData query
//           const rawQuery = req.originalUrl.split('select')[1] || '';
//           const result = parseODataToSQL(tablename, rawQuery);
//           query = result.sql;
//           params = result.parameters;
//       } else {
//           // Handle regular query (your existing implementation)
//           const { columns, where, orderby, limit, offset } = queryParams;
          
//           // Get table columns for validation
//           const tableColumns = await getTableColumns(pool, tablename);
//           const columnNames = tableColumns.map(c => c.column_name);

//           // Build SELECT clause
//           let selectClause = '*';
//           if (columns) {
//               try {
//                   const columnList = JSON.parse(columns);
//                   if (Array.isArray(columnList)) {
//                       const invalidColumns = columnList.filter(col => !columnNames.includes(col));
//                       if (invalidColumns.length > 0) {
//                           return res.status(400).json({
//                               error: 'Invalid column names',
//                               invalidColumns,
//                               availableColumns: columnNames
//                           });
//                       }
//                       selectClause = columnList.map(col => `"${col}"`).join(', ');
//                   }
//               } catch (e) {
//                   return res.status(400).json({ error: 'Invalid columns parameter' });
//               }
//           }

//           // Build WHERE clause
//           let whereClause = '';
//           if (where) {
//               try {
//                   const whereObj = JSON.parse(where);
//                   if (typeof whereObj === 'object' && whereObj !== null) {
//                       const whereParts = [];
//                       for (const [column, value] of Object.entries(whereObj)) {
//                           if (!columnNames.includes(column)) {
//                               return res.status(400).json({
//                                   error: `Column '${column}' not found`,
//                                   availableColumns: columnNames
//                               });
//                           }
//                           if (Array.isArray(value)) {
//                               whereParts.push(`"${column}" IN (${value.map((_, i) => `$${params.length + i + 1}`).join(', ')})`);
//                               params.push(...value);
//                           } else {
//                               whereParts.push(`"${column}" = $${params.length + 1}`);
//                               params.push(value);
//                           }
//                       }
//                       if (whereParts.length > 0) {
//                           whereClause = ` WHERE ${whereParts.join(' AND ')}`;
//                       }
//                   }
//               } catch (e) {
//                   return res.status(400).json({ error: 'Invalid where parameter' });
//               }
//           }

//           // Build ORDER BY clause
//           let orderByClause = '';
//           if (orderby) {
//               try {
//                   const orderByObj = JSON.parse(orderby);
//                   if (typeof orderByObj === 'object' && orderByObj !== null) {
//                       const orderParts = [];
//                       for (const [column, direction] of Object.entries(orderByObj)) {
//                           if (!columnNames.includes(column)) {
//                               return res.status(400).json({
//                                   error: `Column '${column}' not found`,
//                                   availableColumns: columnNames
//                               });
//                           }
//                           const dir = String(direction).toLowerCase() === 'desc' ? 'DESC' : 'ASC';
//                           orderParts.push(`"${column}" ${dir}`);
//                       }
//                       if (orderParts.length > 0) {
//                           orderByClause = ` ORDER BY ${orderParts.join(', ')}`;
//                       }
//                   }
//               } catch (e) {
//                   return res.status(400).json({ error: 'Invalid orderby parameter' });
//               }
//           }

//           // Build LIMIT/OFFSET
//           let limitOffsetClause = '';
//           if (limit) {
//               const limitNum = parseInt(limit);
//               if (!isNaN(limitNum) && limitNum > 0) {
//                   limitOffsetClause = ` LIMIT ${limitNum}`;
//                   if (offset) {
//                       const offsetNum = parseInt(offset);
//                       if (!isNaN(offsetNum) && offsetNum >= 0) {
//                           limitOffsetClause += ` OFFSET ${offsetNum}`;
//                       }
//                   }
//               }
//           }

//           query = `SELECT ${selectClause} FROM "${tablename}"${whereClause}${orderByClause}${limitOffsetClause}`;
//       }

//       console.log('Executing query:', query);
//       console.log('With parameters:', params);

//       const result = await pool.query(query, params);

//       res.status(200).json({
//           success: true,
//           query: query,
//           parameters: params,
//           count: result.rows.length,
//           data: result.rows
//       });

//   } catch (err) {
//       console.error('Error:', err);
//       let status = 500;
//       let errorMessage = err.message;
      
//       if (err.message.includes('relation') && err.message.includes('does not exist')) {
//           status = 404;
//           errorMessage = `Table '${tablename}' not found`;
//       } else if (err.message.includes('column') && err.message.includes('does not exist')) {
//           status = 400;
//           errorMessage = `Invalid column name in query`;
//       } else if (err.message.includes('syntax error')) {
//           status = 400;
//           errorMessage = `Invalid query syntax`;
//       }
      
//       res.status(status).json({ 
//           success: false,
//           error: errorMessage,
//           details: process.env.NODE_ENV === 'development' ? err.stack : undefined
//       });
//   }
// });




// ========== SELECT API ENDPOINT (GET VERSION) ==========
// router.get('/:dbname/:tablename/select', validateApiKey, async (req, res) => {
//   const { dbname, tablename } = req.params;
  
//   try {
//     // Validate database and table name
//     if (!/^[a-zA-Z0-9_]+$/.test(dbname)) {
//       return res.status(400).json({ error: 'Invalid database name' });
//     }
    
//     if (!/^[a-zA-Z0-9_]+$/.test(tablename)) {
//       return res.status(400).json({ error: 'Invalid table name' });
//     }

//     const pool = getDbPool(dbname);

//     // Check if table exists
//     const tableExists = await pool.query(
//       `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1)`,
//       [tablename]
//     );
    
//     if (!tableExists.rows[0].exists) {
//       return res.status(404).json({ error: `Table '${tablename}' not found` });
//     }

//     // Get query parameters from URL
//     const { 
//       columns, 
//       where, 
//       orderby, 
//       limit, 
//       offset 
//     } = req.query;

//     // Get table columns for validation
//     const tableColumns = await getTableColumns(pool, tablename);
//     const columnNames = tableColumns.map(c => c.column_name);

//     // Build SELECT clause
//     let selectClause = '*';
//     if (columns) {
//       try {
//         const columnList = JSON.parse(columns);
//         if (Array.isArray(columnList)) {
//           // Validate requested columns exist
//           const invalidColumns = columnList.filter(col => !columnNames.includes(col));
//           if (invalidColumns.length > 0) {
//             return res.status(400).json({
//               error: 'Invalid column names',
//               invalidColumns,
//               availableColumns: columnNames
//             });
//           }
//           selectClause = columnList.map(col => `"${col}"`).join(', ');
//         }
//       } catch (e) {
//         return res.status(400).json({ error: 'Invalid columns parameter - must be JSON array' });
//       }
//     }

//     // Build WHERE clause
//     let whereClause = '';
//     const params = [];
//     if (where) {
//       try {
//         const whereObj = JSON.parse(where);
//         if (typeof whereObj === 'object' && whereObj !== null) {
//           const whereParts = [];
//           let paramIndex = 1;

//           for (const [column, value] of Object.entries(whereObj)) {
//             if (!columnNames.includes(column)) {
//               return res.status(400).json({
//                 error: `Column '${column}' not found in table`,
//                 availableColumns: columnNames
//               });
//             }

//             if (Array.isArray(value)) {
//               // Handle IN clause
//               whereParts.push(`"${column}" IN (${value.map((_, i) => `$${paramIndex + i}`).join(', ')})`);
//               params.push(...value);
//               paramIndex += value.length;
//             } else {
//               // Handle equality
//               whereParts.push(`"${column}" = $${paramIndex}`);
//               params.push(value);
//               paramIndex++;
//             }
//           }

//           if (whereParts.length > 0) {
//             whereClause = ` WHERE ${whereParts.join(' AND ')}`;
//           }
//         }
//       } catch (e) {
//         return res.status(400).json({ error: 'Invalid where parameter - must be JSON object' });
//       }
//     }

//     // Build ORDER BY clause
//     let orderByClause = '';
//     if (orderby) {
//       try {
//         const orderByObj = JSON.parse(orderby);
//         if (typeof orderByObj === 'object' && orderByObj !== null) {
//           const orderParts = [];
          
//           for (const [column, direction] of Object.entries(orderByObj)) {
//             if (!columnNames.includes(column)) {
//               return res.status(400).json({
//                 error: `Column '${column}' not found in table`,
//                 availableColumns: columnNames
//               });
//             }

//             const dir = String(direction).toLowerCase() === 'desc' ? 'DESC' : 'ASC';
//             orderParts.push(`"${column}" ${dir}`);
//           }

//           if (orderParts.length > 0) {
//             orderByClause = ` ORDER BY ${orderParts.join(', ')}`;
//           }
//         }
//       } catch (e) {
//         return res.status(400).json({ error: 'Invalid orderby parameter - must be JSON object' });
//       }
//     }

//     // Build LIMIT/OFFSET clauses
//     let limitOffsetClause = '';
//     if (limit) {
//       const limitNum = parseInt(limit);
//       if (!isNaN(limitNum) && limitNum > 0) {
//         limitOffsetClause = ` LIMIT ${limitNum}`;
        
//         if (offset) {
//           const offsetNum = parseInt(offset);
//           if (!isNaN(offsetNum) && offsetNum >= 0) {
//             limitOffsetClause += ` OFFSET ${offsetNum}`;
//           }
//         }
//       }
//     }

//     // Construct final query
//     const query = `SELECT ${selectClause} FROM "${tablename}"${whereClause}${orderByClause}${limitOffsetClause}`;
    
//     console.log('Generated SELECT query:', query);
//     console.log('With parameters:', params);

//     // Execute query
//     const result = await pool.query(query, params);

//     res.status(200).json({
//       success: true,
//       query: query,
//       parameters: params,
//       count: result.rows.length,
//       data: result.rows
//     });

//   } catch (err) {
//     console.error('Error in SELECT API:', err);
    
//     let status = 500;
//     let errorMessage = err.message;
    
//     if (err.message.includes('relation') && err.message.includes('does not exist')) {
//       status = 404;
//       errorMessage = `Table '${tablename}' not found`;
//     } else if (err.message.includes('column') && err.message.includes('does not exist')) {
//       status = 400;
//       errorMessage = `Invalid column name in query`;
//     } else if (err.message.includes('syntax error')) {
//       status = 400;
//       errorMessage = `Invalid query syntax`;
//     }
    
//     res.status(status).json({ 
//       success: false,
//       error: errorMessage,
//       details: process.env.NODE_ENV === 'development' ? err.stack : undefined
//     });
//   }
// });

// Metadata endpoint
router.get('/:dbname/$metadata', validateApiKey, async (req, res) => {
  const { dbname } = req.params;
  
  try {
    const pool = getDbPool(dbname);
    
    // Get all tables
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    // Get all columns for each table
    const metadata = {
      $Version: '4.0',
      $EntityContainer: 'DefaultContainer',
      EntitySets: {}
    };
    
    for (const table of tables.rows) {
      const tableName = table.table_name;
      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = $1
      `, [tableName]);
      
      metadata.EntitySets[tableName] = {
        properties: columns.rows.map(col => ({
          name: col.column_name,
          type: mapPostgresTypeToOData(col.data_type),
          nullable: col.is_nullable === 'YES',
          defaultValue: col.column_default
        }))
      };
    }
    
    res.status(200).json(metadata);
  } catch (err) {
    console.error('Error fetching metadata:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});





// Batch operations endpoint for multiple query operations in a single API call
router.post('/:dbname/batch', validateApiKey, async (req, res) => {
  const { dbname } = req.params;
  
  try {
    // Validate database name
    if (!/^[a-zA-Z0-9_]+$/.test(dbname)) {
      return res.status(400).json({ error: 'Invalid database name' });
    }
    
    // Validate request body
    if (!req.body || !Array.isArray(req.body.operations)) {
      return res.status(400).json({ 
        error: 'Invalid request format', 
        details: 'Request must include an operations array' 
      });
    }
    
    const { operations } = req.body;
    if (operations.length === 0) {
      return res.status(400).json({ 
        error: 'Empty operations array', 
        details: 'At least one operation must be provided' 
      });
    }
    
    // Limit the number of operations to prevent abuse
    if (operations.length > 20) {
      return res.status(400).json({ 
        error: 'Too many operations', 
        details: 'Maximum of 20 operations allowed per batch request' 
      });
    }
    
    const pool = getDbPool(dbname);
    
    // Use a transaction to ensure atomicity
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const results = [];
      
      // Process each operation
      for (let i = 0; i < operations.length; i++) {
        const operation = operations[i];
        
        // Validate operation structure
        if (!operation.type || !operation.table) {
          throw new Error(`Invalid operation at index ${i}: missing type or table`);
        }
        
        // Validate table name
        if (!/^[a-zA-Z0-9_]+$/.test(operation.table)) {
          throw new Error(`Invalid table name '${operation.table}' at index ${i}`);
        }
        
        // Verify table exists
        const tableExists = await client.query(
          `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1)`,
          [operation.table]
        );
        
        if (!tableExists.rows[0].exists) {
          throw new Error(`Table '${operation.table}' not found at index ${i}`);
        }
        
        // Get table columns for validation
        const tableColumns = await getTableColumns(client, operation.table);
        const columnNames = tableColumns.map(c => c.column_name);
        
        let result;
        
        switch (operation.type.toLowerCase()) {
          case 'select':
            result = await processSelectOperation(client, operation, columnNames, i);
            break;
          case 'odata':
            result = await processODataOperation(client, operation, columnNames, i);
            break;
          default:
            throw new Error(`Unsupported operation type '${operation.type}' at index ${i}`);
        }
        
        results.push({
          index: i,
          table: operation.table,
          type: operation.type,
          data: result
        });
      }
      
      await client.query('COMMIT');
      
      res.status(200).json({
        success: true,
        results
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error in batch operations:', err);
    
    res.status(err.statusCode || 500).json({ 
      success: false,
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Add this to log all queries
const logQuery = (query, values) => {
  console.log('Executing query:', query);
  if (values) console.log('With values:', values);
};


// router.post('/:dbname/:tablename/insert', validateApiKey, async (req, res) => {
//   const { dbname, tablename } = req.params;
//   const { data } = req.body;
//   const { $filter, $orderby, $top, $skip, $select } = req.query;

//   console.log('\n=== Received Request ===');
//   console.log('Path:', req.path);
//   console.log('Body:', JSON.stringify(req.body, null, 2));
//   console.log('Query Params:', req.query);

//   if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
//     return res.status(400).json({ error: 'Invalid or empty data object in request body' });
//   }

//   try {
//     const pool = getDbPool(dbname);
//     const columns = Object.keys(data);
//     const values = Object.values(data);
//     const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

//     // Base INSERT query
//     let query = `INSERT INTO ${tablename} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    
//     // Log before execution
//     logQuery(query, values);
    
//     const result = await pool.query(query, values);
    
//     // Rest of your OData handling...
//     res.status(201).json({ /* your response */ });

//   } catch (err) {
//     console.error('❌ Full error stack:', err.stack); // Log full error stack
//     res.status(500).json({ error: 'Internal server error', details: err.message });
//   }
// });




// router.patch('/:dbname/:tablename/update', validateApiKey, async (req, res) => {
//   const { dbname, tablename } = req.params;
//   const { filter, data } = req.body;
//   const { $select, $filter, $top } = req.query; // OData parameters

//   // Validate inputs
//   if (!filter || Object.keys(filter).length === 0) {
//     return res.status(400).json({ error: 'Filter object is required' });
//   }
//   if (!data || Object.keys(data).length === 0) {
//     return res.status(400).json({ error: 'Data object is required' });
//   }

//   try {
//     const pool = getDbPool(dbname);
    
//     // Build SET clause
//     const setClause = Object.keys(data)
//       .map((key, i) => `${key} = $${i + 1}`)
//       .join(', ');
    
//     // Build WHERE clause from both body.filter and query.$filter
//     const whereClauses = [];
//     const values = [...Object.values(data)];
    
//     // Add filter from body
//     Object.entries(filter).forEach(([key, val]) => {
//       whereClauses.push(`${key} = $${values.length + 1}`);
//       values.push(val);
//     });
    
//     // Add OData $filter if provided
//     if ($filter) {
//       whereClauses.push($filter.replace(/eq/g, '=').replace(/ne/g, '!='));
//     }
    
//     // Construct base query
//     let query = `
//       UPDATE ${tablename}
//       SET ${setClause}
//       WHERE ${whereClauses.join(' AND ')}
//       RETURNING *
//     `;
    
//     // Apply OData $select
//     if ($select) {
//       query = `
//         WITH updated AS (${query})
//         SELECT ${$select.split(',').map(f => f.trim()).join(', ')} 
//         FROM updated
//       `;
//     }
    
//     // Apply OData $top
//     if ($top) {
//       query += ` LIMIT ${parseInt($top)}`;
//     }

//     console.log('Executing PATCH:', query, values);
//     const result = await pool.query(query, values);

//     res.status(200).json({
//       success: true,
//       updatedCount: result.rowCount,
//       updated: result.rows
//     });

//   } catch (err) {
//     console.error('PATCH error:', err);
//     res.status(500).json({ 
//       error: 'Update failed',
//       details: err.message 
//     });
//   }
// });



// router.patch('/:dbname/:tablename', validateApiKey, async (req, res) => {
//   const { dbname, tablename } = req.params;
//   const data = req.body;
  
//   // Parse OData $filter from query parameters
//   const filter = req.query.$filter;
  
//   if (!filter) {
//       return res.status(400).json({ error: 'Missing $filter parameter for PATCH operation' });
//   }
  
//   if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
//       return res.status(400).json({ error: 'Invalid or missing data object' });
//   }
  
//   try {
//       const pool = getDbPool(dbname);
      
//       // Convert OData $filter to SQL WHERE clause
//       // Note: You'll need an OData parser library or custom implementation
//       const { whereClause, parameters } = convertODataFilterToSQL(filter);
      
//       // Build SET clause for update
//       const setColumns = Object.keys(data).map((col, i) => `${col} = $${i + 1}`);
//       const setValues = Object.values(data);
      
//       // Combine parameters (set values first, then where parameters)
//       const allParams = [...setValues, ...parameters];
      
//       const query = `UPDATE ${tablename} SET ${setColumns.join(', ')} WHERE ${whereClause} RETURNING *`;
      
//       const result = await pool.query(query, allParams);
      
//       if (result.rows.length === 0) {
//           return res.status(404).json({ message: 'No matching rows found to update' });
//       }
      
//       res.status(200).json({
//           message: 'Row(s) updated successfully',
//           data: result.rows,
//       });
//   } catch (err) {
//       console.error('❌ Error updating row:', err);
//       res.status(500).json({ error: 'Internal server error', details: err.message });
//   }
// });

// router.patch('/:dbname/:tablename', validateApiKey, async (req, res) => {
//   const { dbname, tablename } = req.params;
  
//   // Parse OData $filter from query parameters
//   const filter = req.query.$filter;
//   const updateValues = req.query.$update; // New parameter for update values
  
//   if (!filter) {
//     return res.status(400).json({ error: 'Missing $filter parameter for PATCH operation' });
//   }
  
//   if (!updateValues) {
//     return res.status(400).json({ error: 'Missing $update parameter with update values' });
//   }
  
//   try {
//     // Parse the update values (format: "column1=value1,column2=value2")
//     const data = {};
//     updateValues.split(',').forEach(pair => {
//       const [key, value] = pair.split('=');
//       if (key && value) {
//         data[key] = value;
//       }
//     });
    
//     if (Object.keys(data).length === 0) {
//       return res.status(400).json({ error: 'Invalid update values format' });
//     }
    
//     const pool = getDbPool(dbname);
    
//     // Convert OData $filter to SQL WHERE clause
//     const { whereClause, parameters } = convertODataFilterToSQL(filter);
    
//     // Build SET clause for update
//     const setColumns = Object.keys(data).map((col, i) => `${col} = $${i + 1}`);
//     const setValues = Object.values(data);
    
//     // Combine parameters (set values first, then where parameters)
//     const allParams = [...setValues, ...parameters];
    
//     const query = `UPDATE ${tablename} SET ${setColumns.join(', ')} WHERE ${whereClause} RETURNING *`;
    
//     const result = await pool.query(query, allParams);
    
//     if (result.rows.length === 0) {
//       return res.status(404).json({ message: 'No matching rows found to update' });
//     }
    
//     res.status(200).json({
//       message: 'Row(s) updated successfully',
//       data: result.rows,
//     });
//   } catch (err) {
//     console.error('❌ Error updating row:', err);
//     res.status(500).json({ error: 'Internal server error', details: err.message });
//   }
// });

router.patch('/:dbname/:tablename', validateApiKey, async (req, res) => {
  const { dbname, tablename } = req.params;
  
  const filter = req.query.$filter;
  const updateValues = req.query.$update;

  if (!filter) {
    return res.status(400).json({ error: 'Missing $filter parameter for PATCH operation' });
  }
  
  if (!updateValues) {
    return res.status(400).json({ error: 'Missing $update parameter with update values' });
  }
  
  try {
    // Parse the update values with trimming
    const data = {};
    updateValues.split(',').forEach(pair => {
      const [key, value] = pair.split('=');
      if (key && value) {
        data[key] = typeof value === 'string' 
          ? value.trim().replace(/\s+/g, ' ')
          : value;
      }
    });
    
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'Invalid update values format' });
    }
    
    const pool = getDbPool(dbname);
    
    // Convert OData $filter to SQL WHERE clause
    const { whereClause, parameters: whereParams } = convertODataFilterToSQL(filter);
    
    // Build SET clause for update
    const setColumns = Object.keys(data).map((col, i) => `${col} = $${i + 1}`);
    const setValues = Object.values(data);
    
    // Combine parameters (set values first, then where parameters)
    // Note the offset for WHERE parameters starts after SET parameters
    const allParams = [...setValues, ...whereParams];
    const whereParamStartIndex = setValues.length + 1;
    
    // Replace original parameter placeholders in whereClause with correct positions
    const adjustedWhereClause = whereClause.replace(/\$\d+/g, (match) => {
      const originalPos = parseInt(match.substring(1));
      return `$${originalPos + whereParamStartIndex - 1}`;
    });
    
    const query = `UPDATE ${tablename} SET ${setColumns.join(', ')} WHERE ${adjustedWhereClause} RETURNING *`;
    
    console.log('Final query:', query);
    console.log('Parameters:', allParams);
    
    const result = await pool.query(query, allParams);
    
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




// Helper function to convert OData $filter to SQL (simplified example)
function convertODataFilterToSQL(filter) {
  // In a real implementation, you would use a library like odata-parser
  // or implement a proper parser for your supported OData operations
  
  // This is a very basic example that only handles simple equality filters
  const conditions = [];
  const parameters = [];
  
  // Simple parser for "Property eq 'Value'" format
  const simpleEqRegex = /(\w+)\s+eq\s+('[^']*'|\d+)/g;
  let match;
  
  while ((match = simpleEqRegex.exec(filter)) !== null) {
      conditions.push(`${match[1]} = $${conditions.length + 1}`);
      parameters.push(match[2].replace(/'/g, ''));
  }
  
  if (conditions.length === 0) {
      throw new Error('Unsupported or invalid OData filter');
  }
  
  return {
      whereClause: conditions.join(' AND '),
      parameters
  };
}

// router.delete('/:dbname/:tablename/delete', validateApiKey, async (req, res) => {
//   const { dbname, tablename } = req.params;
//   const { filter } = req.body;
//   const { $select, $filter, $top } = req.query; // OData parameters

//   if (!filter || Object.keys(filter).length === 0) {
//     return res.status(400).json({ error: 'Filter object is required' });
//   }

//   try {
//     const pool = getDbPool(dbname);
//     const whereClauses = [];
//     const values = [];
    
//     // Add filter from body
//     Object.entries(filter).forEach(([key, val]) => {
//       whereClauses.push(`${key} = $${values.length + 1}`);
//       values.push(val);
//     });
    
//     // Add OData $filter if provided
//     if ($filter) {
//       whereClauses.push($filter.replace(/eq/g, '=').replace(/ne/g, '!='));
//     }
    
//     // Construct base query
//     let query = `
//       DELETE FROM ${tablename}
//       WHERE ${whereClauses.join(' AND ')}
//       RETURNING *
//     `;
    
//     // Apply OData $select
//     if ($select) {
//       query = `
//         WITH deleted AS (${query})
//         SELECT ${$select.split(',').map(f => f.trim()).join(', ')} 
//         FROM deleted
//       `;
//     }
    
//     // Apply OData $top
//     if ($top) {
//       query += ` LIMIT ${parseInt($top)}`;
//     }

//     console.log('Executing DELETE:', query, values);
//     const result = await pool.query(query, values);

//     res.status(200).json({
//       success: true,
//       deletedCount: result.rowCount,
//       deleted: result.rows
//     });

//   } catch (err) {
//     console.error('DELETE error:', err);
//     res.status(500).json({ 
//       error: 'Delete failed',
//       details: err.message 
//     });
//   }
// });

router.delete('/:dbname/:tablename', validateApiKey, async (req, res) => {
  const { dbname, tablename } = req.params;
  
  const filter = req.query.$filter;

  if (!filter) {
    return res.status(400).json({ error: 'Missing $filter parameter for DELETE operation' });
  }
  
  try {
    const pool = getDbPool(dbname);
    
    // Convert OData $filter to SQL WHERE clause
    const { whereClause, parameters } = convertODataFilterToSQL(filter);
    
    // For DELETE, we don't need SET clause, just WHERE
    const query = `DELETE FROM ${tablename} WHERE ${whereClause} RETURNING *`;
    
    console.log('Final DELETE query:', query);
    console.log('Parameters:', parameters);
    
    const result = await pool.query(query, parameters);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No matching rows found to delete' });
    }
    
    res.status(200).json({
      message: 'Row(s) deleted successfully',
      data: result.rows,
      count: result.rowCount
    });
  } catch (err) {
    console.error('❌ Error deleting row:', err);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: err.message,
      hint: err.hint || undefined // Include PostgreSQL hint if available
    });
  }
});



// router.post('/:dbname/:tablename/post', validateApiKey, async (req, res) => {
//   const { dbname, tablename } = req.params;
//   const queryParams = req.query; // Get data from query parameters
  
//   // Check if we have any query parameters
//   if (!queryParams || Object.keys(queryParams).length === 0) {
//     return res.status(400).json({ error: 'Data must be provided in query parameters' });
//   }
  
//   try {
//     // Map query parameter names to database column names
//     const paramToColumnMap = {
//       'name': 'user_name',
//       'mail': 'email',
//       'location': 'city',
//       'region': 'state',
//       'phone': 'mobile_no',
//       'fullAddress': 'address'
//       // Add more mappings as needed
//     };
    
//     // Create data object with correct column names
//     const data = {};
//     Object.keys(queryParams).forEach(param => {
//       // Check if this parameter has a mapping
//       const columnName = paramToColumnMap[param];
//       if (columnName) {
//         data[columnName] = queryParams[param];
//       } else {
//         // If no mapping exists, use the parameter name as is
//         data[param] = queryParams[param];
//       }
//     });
    
//     // Ensure we have data to insert after mapping
//     if (Object.keys(data).length === 0) {
//       return res.status(400).json({ error: 'No valid data parameters provided' });
//     }
    
//     const pool = getDbPool(dbname);
//     const columns = Object.keys(data);
//     const values = Object.values(data);
//     const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
//     const query = `
//       INSERT INTO ${tablename} (${columns.join(', ')})
//       VALUES (${placeholders})
//       RETURNING *
//     `;
//     console.log('Executing:', query, values); // Debug log
//     const result = await pool.query(query, values);
    
//     // Explicitly send the inserted row data
//     res.status(201).json({
//       success: true,
//       inserted: result.rows[0] // Ensure this matches your table structure
//     });
//   } catch (err) {
//     console.error('Insert error:', err);
//     res.status(500).json({ 
//       error: 'Insert failed',
//       details: err.message 
//     });
//   }
// });






// Process SELECT operation


// router.post('/:dbname/:tablename/post', (req, res, next) => {
//   // Skip body parsing by setting req.body to empty object
//   req.body = {};
//   next();
// }, validateApiKey, async (req, res) => {
//   const { dbname, tablename } = req.params;
//   const data = req.query; 
  
//   // Extract data from query parameters (OData style)
//   // const data = {};
//   for (const [key, value] of Object.entries(req.query)) {
//       // Skip OData system parameters that start with $
//       if (!key.startsWith('$')) {
//           data[key] = value;
//       }
//   }

//   if (Object.keys(data).length === 0) {
//       return res.status(400).json({ error: 'No valid data provided in query parameters' });
//   }

//   try {
//       const pool = getDbPool(dbname);

//       const columns = Object.keys(data);
//       const values = Object.values(data);
//       const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

//       const query = `INSERT INTO ${tablename} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`;
//       const result = await pool.query(query, values);

//       res.status(201).json({
//           message: 'Row inserted successfully',
//           data: result.rows[0],
//       });
//   } catch (err) {
//       console.error('❌ Error inserting row:', err);
//       res.status(500).json({ 
//           error: 'Internal server error', 
//           details: err.message 
//       });
//   }
// });

// router.post('/:dbname/:tablename/post', 
//   (req, res, next) => {
//     req.body = {}; // Skip body parsing
//     next();
//   },
//   validateApiKey,
//   async (req, res) => {
//     const { dbname, tablename } = req.params;
    
//     // Extract data from query parameters
//     const data = {};
//     for (const [key, value] of Object.entries(req.query)) {
//       if (!key.startsWith('$')) {
//         data[key] = value;
//       }
//     }

//     if (Object.keys(data).length === 0) {
//       return res.status(400).json({ error: 'No valid data provided in query parameters' });
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
//       res.status(500).json({ 
//         error: 'Internal server error', 
//         details: err.message 
//       });
//     }
//   }
// );


// router.post('/:dbname/:tablename/insert', validateApiKey, async (req, res) => {
//   const { dbname, tablename } = req.params;
//   const { data } = req.body;

//   if (!data || typeof data !== 'object') {
//     return res.status(400).json({ error: 'Data must be a non-empty object' });
//   }

//   try {
//     const pool = getDbPool(dbname);
//     const columns = Object.keys(data);
//     const values = Object.values(data);
//     const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

//     const query = `
//       INSERT INTO ${tablename} (${columns.join(', ')})
//       VALUES (${placeholders})
//       RETURNING *
//     `;

//     console.log('Executing:', query, values); // Debug log

//     const result = await pool.query(query, values);
    
//     // Explicitly send the inserted row data
//     res.status(201).json({
//       success: true,
//       inserted: result.rows[0] // Ensure this matches your table structure
//     });

//   } catch (err) {
//     console.error('Insert error:', err);
//     res.status(500).json({ 
//       error: 'Insert failed',
//       details: err.message 
//     });
//   }
// });

router.post('/:dbname/:tablename/insert', 
  (req, res, next) => {
    req.body = {}; // Skip body parsing
    next();
  },
  validateApiKey,
  async (req, res) => {
    const { dbname, tablename } = req.params;
    
    // Extract and trim data from query parameters
    const data = {};
    for (const [key, value] of Object.entries(req.query)) {
      if (!key.startsWith('$')) { 
        // Trim string values and replace multiple spaces with single space
        data[key] = typeof value === 'string' 
          ? value.trim().replace(/\s+/g, ' ') 
          : value;
      }
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No valid data provided in query parameters' });
    }

    try {
      const pool = getDbPool(dbname);
      const columns = Object.keys(data);
      const values = Object.values(data);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

      const query = `INSERT INTO ${tablename} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`;
      
      // Debug logging
      // console.log('Executing SQL Query:');
      // console.log('Query:', query);
      // console.log('Values:', values);
      // console.log('Values after trimming:', values.map(v => typeof v === 'string' ? `"${v}"` : v));
      
      const result = await pool.query(query, values);

      // Verify the inserted data
      const verifyQuery = `SELECT * FROM ${tablename} WHERE id = $1`;
      const verification = await pool.query(verifyQuery, [result.rows[0].id]);
      
      res.status(201).json({
        message: 'Row inserted successfully',
        data: verification.rows[0],
      });
    } catch (err) {
      console.error('❌ Error inserting row:', err);
      res.status(500).json({ 
        error: 'Internal server error', 
        details: err.message,
        query: err.query  // Include the failed query in response for debugging
      });
    }
  }
);


async function processSelectOperation(client, operation, columnNames, index) {
  // Build SELECT clause
  let selectClause = '*';
  if (operation.columns) {
    if (!Array.isArray(operation.columns)) {
      throw createError(400, `Invalid columns parameter - must be an array at index ${index}`);
    }
    
    // Validate requested columns exist
    const invalidColumns = operation.columns.filter(col => !columnNames.includes(col));
    if (invalidColumns.length > 0) {
      throw createError(400, `Invalid column names at index ${index}: ${invalidColumns.join(', ')}`);
    }
    
    selectClause = operation.columns.map(col => `"${col}"`).join(', ');
  }
  
  // Build WHERE clause
  let whereClause = '';
  const params = [];
  if (operation.where) {
    if (typeof operation.where !== 'object' || operation.where === null) {
      throw createError(400, `Invalid where parameter - must be an object at index ${index}`);
    }
    
    const whereParts = [];
    let paramIndex = 1;
    
    for (const [column, value] of Object.entries(operation.where)) {
      if (!columnNames.includes(column)) {
        throw createError(400, `Column '${column}' not found in table at index ${index}`);
      }
      
      if (Array.isArray(value)) {
        // Handle IN clause
        whereParts.push(`"${column}" IN (${value.map((_, i) => `$${paramIndex + i}`).join(', ')})`);
        params.push(...value);
        paramIndex += value.length;
      } else if (value === null) {
        // Handle NULL check
        whereParts.push(`"${column}" IS NULL`);
      } else if (typeof value === 'object') {
        // Handle special operators
        for (const [op, val] of Object.entries(value)) {
          switch (op.toLowerCase()) {
            case 'eq':
              whereParts.push(`"${column}" = $${paramIndex}`);
              params.push(val);
              paramIndex++;
              break;
            case 'ne':
              whereParts.push(`"${column}" != $${paramIndex}`);
              params.push(val);
              paramIndex++;
              break;
            case 'gt':
              whereParts.push(`"${column}" > $${paramIndex}`);
              params.push(val);
              paramIndex++;
              break;
            case 'gte':
            case 'ge':
              whereParts.push(`"${column}" >= $${paramIndex}`);
              params.push(val);
              paramIndex++;
              break;
            case 'lt':
              whereParts.push(`"${column}" < $${paramIndex}`);
              params.push(val);
              paramIndex++;
              break;
            case 'lte':
            case 'le':
              whereParts.push(`"${column}" <= $${paramIndex}`);
              params.push(val);
              paramIndex++;
              break;
            case 'like':
              whereParts.push(`"${column}" LIKE $${paramIndex}`);
              params.push(val);
              paramIndex++;
              break;
            case 'contains':
              whereParts.push(`"${column}" ILIKE $${paramIndex}`);
              params.push(`%${val}%`);
              paramIndex++;
              break;
            case 'startswith':
              whereParts.push(`"${column}" ILIKE $${paramIndex}`);
              params.push(`${val}%`);
              paramIndex++;
              break;
            case 'endswith':
              whereParts.push(`"${column}" ILIKE $${paramIndex}`);
              params.push(`%${val}`);
              paramIndex++;
              break;
            default:
              throw createError(400, `Unknown operator '${op}' at index ${index}`);
          }
        }
      } else {
        // Handle equality
        whereParts.push(`"${column}" = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    }
    
    if (whereParts.length > 0) {
      whereClause = ` WHERE ${whereParts.join(' AND ')}`;
    }
  }
  
  // Build ORDER BY clause
  let orderByClause = '';
  if (operation.orderby) {
    if (typeof operation.orderby !== 'object' || operation.orderby === null) {
      throw createError(400, `Invalid orderby parameter - must be an object at index ${index}`);
    }
    
    const orderParts = [];
    
    for (const [column, direction] of Object.entries(operation.orderby)) {
      if (!columnNames.includes(column)) {
        throw createError(400, `Column '${column}' not found in table at index ${index}`);
      }
      
      const dir = String(direction).toLowerCase() === 'desc' ? 'DESC' : 'ASC';
      orderParts.push(`"${column}" ${dir}`);
    }
    
    if (orderParts.length > 0) {
      orderByClause = ` ORDER BY ${orderParts.join(', ')}`;
    }
  }
  
  // Build LIMIT/OFFSET clauses
  let limitOffsetClause = '';
  if (operation.limit) {
    const limitNum = parseInt(operation.limit);
    if (isNaN(limitNum) || limitNum <= 0) {
      throw createError(400, `Invalid limit parameter at index ${index}`);
    }
    
    limitOffsetClause = ` LIMIT ${limitNum}`;
    
    if (operation.offset) {
      const offsetNum = parseInt(operation.offset);
      if (isNaN(offsetNum) || offsetNum < 0) {
        throw createError(400, `Invalid offset parameter at index ${index}`);
      }
      
      limitOffsetClause += ` OFFSET ${offsetNum}`;
    }
  }
  
  // Construct final query
  const query = `SELECT ${selectClause} FROM "${operation.table}"${whereClause}${orderByClause}${limitOffsetClause}`;
  
  console.log(`[Batch Operation ${index}] Generated SELECT query:`, query);
  console.log(`[Batch Operation ${index}] With parameters:`, params);
  
  // Execute query
  const result = await client.query(query, params);
  
  return {
    count: result.rows.length,
    data: result.rows
  };
}

// Process OData operation
async function processODataOperation(client, operation, columnNames, index) {
  if (!operation.query) {
    throw createError(400, `Missing query parameter for OData operation at index ${index}`);
  }
  
  // Parse OData query
  let odataQuery;
  try {
    odataQuery = odataParser(operation.query);
    console.log(`[Batch Operation ${index}] Parsed OData query:`, JSON.stringify(odataQuery, null, 2));
  } catch (parseErr) {
    throw createError(400, `Invalid OData query at index ${index}: ${parseErr.message}`);
  }
  
  const { query, params } = await convertODataToSQL(client, operation.table, odataQuery);
  
  console.log(`[Batch Operation ${index}] Generated OData SQL query:`, query);
  console.log(`[Batch Operation ${index}] With parameters:`, params);
  
  // Execute query
  const result = await client.query(query, params);
  
  return {
    count: result.rows.length,
    data: result.rows
  };
}

// Helper function to create an error with status code
function createError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}









// Helper function to map Postgres types to OData types
function mapPostgresTypeToOData(pgType) {
  const typeMap = {
    'integer': 'Edm.Int32',
    'bigint': 'Edm.Int64',
    'smallint': 'Edm.Int16',
    'character varying': 'Edm.String',
    'text': 'Edm.String',
    'boolean': 'Edm.Boolean',
    'numeric': 'Edm.Decimal',
    'real': 'Edm.Single',
    'double precision': 'Edm.Double',
    'timestamp without time zone': 'Edm.DateTime',
    'timestamp with time zone': 'Edm.DateTimeOffset',
    'date': 'Edm.Date',
    'time without time zone': 'Edm.Time',
    'time with time zone': 'Edm.TimeOfDay',
    'interval': 'Edm.Duration',
    'uuid': 'Edm.Guid',
    'json': 'Edm.String',
    'jsonb': 'Edm.String'
  };
  
  return typeMap[pgType] || 'Edm.String';
}











module.exports = router;