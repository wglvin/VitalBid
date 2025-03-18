const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/config');

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  schema: 'bidding_service', // Add schema to isolate tables per microservice
  logging: false
});

// Define models specific to the bidding service
const Bid = sequelize.define('Bid', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  listingId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  bidderId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.01, // Ensure bids are positive
      notNull: true
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'accepted', 'rejected', 'cancelled'),
    defaultValue: 'active'
  },
  bidTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

// Initialize models and relationships
const db = {
  sequelize,
  Sequelize,
  Bid
};

// Function to initialize database with schema creation
db.initialize = async () => {
  try {
    // Create the schema if it doesn't exist
    await sequelize.query('CREATE SCHEMA IF NOT EXISTS bidding_service;');
    
    // Sync all models with the database
    await sequelize.sync();
    console.log('Bidding service database synchronized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

module.exports = db; 