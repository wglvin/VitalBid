const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/config');

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  schema: 'list_service', // Add schema to isolate tables per microservice
  logging: false
});

// Define models specific to the listing service
const Organ = sequelize.define('Organ', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, // Add uniqueness constraint to prevent duplicate organ types
    validate: {
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

const Listing = sequelize.define('Listing', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  startingPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'pending', 'completed', 'cancelled'),
    defaultValue: 'active'
  },
  expiryDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  donorId: {
    type: DataTypes.UUID,
    allowNull: false
  }
});

// Define relationships between models
Listing.belongsTo(Organ, { foreignKey: 'organId' });
Organ.hasMany(Listing, { foreignKey: 'organId' });

// Initialize models and relationships
const db = {
  sequelize,
  Sequelize,
  Organ,
  Listing
};

// Function to initialize database with schema creation
db.initialize = async () => {
  try {
    // Create the schema if it doesn't exist
    await sequelize.query('CREATE SCHEMA IF NOT EXISTS list_service;');
    
    // Sync all models with the database WITHOUT dropping tables
    await sequelize.sync({ force: false, alter: true });
    console.log('Listing service database synchronized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

module.exports = db; 