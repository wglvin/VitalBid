// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'listing-db',
  port: process.env.DB_PORT || 3308,
  dialect: 'mysql',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'listing_db',
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

module.exports = dbConfig; 