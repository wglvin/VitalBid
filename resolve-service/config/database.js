const mysql = require('mysql2/promise');

// Initialize connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'resolving-db',
  port: process.env.DB_PORT || '3308',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'resolving_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Connection for bidding_db
const biddingPool = mysql.createPool({
  host: process.env.BIDDING_DB_HOST || 'bidding-db',
  port: process.env.BIDDING_DB_PORT || '3307',
  user: process.env.BIDDING_DB_USER || 'root',
  password: process.env.BIDDING_DB_PASSWORD || 'password',
  database: process.env.BIDDING_DB_NAME || 'bidding_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// // Function to execute SQL queries
// const executeQuery = async (sql, params = []) => {
//   try {
//     const [results] = await pool.execute(sql, params);
//     return results;
//   } catch (error) {
//     console.error('Database query error:', error);
//     throw error;
//   }
// };

const executeQueryWithPool = async (pool, sql, params = []) => {
  const [results] = await pool.execute(sql, params);
  return results;
};

// Backward-compatible: uses default resolving-db if no pool passed
const executeQuery = async (sqlOrPool, sqlOrParams, maybeParams) => {
  if (typeof sqlOrPool === 'string') {
    // Called as (sql, params)
    const sql = sqlOrPool;
    const params = sqlOrParams || [];
    return executeQueryWithPool(pool, sql, params);
  } else {
    // Called as (pool, sql, params)
    return executeQueryWithPool(sqlOrPool, sqlOrParams, maybeParams || []);
  }
};




// Test database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Successfully connected to the database');
    connection.release();
    return true;
  } catch (error) {
    console.error('Failed to connect to the database:', error);
    throw error;
  }
};

module.exports = {
  executeQuery,
  executeQueryWithPool,
  testConnection,
  biddingPool,
  pool
};
