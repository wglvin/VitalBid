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

// Function to execute SQL queries
const executeQuery = async (sql, params = []) => {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
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
  testConnection,
  pool
}; 