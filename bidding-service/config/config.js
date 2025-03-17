// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'bidding-db',
  port: process.env.DB_PORT || 3306,
  dialect: 'mysql',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'bidding_db',
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

module.exports = dbConfig; 