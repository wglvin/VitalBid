const express = require('express');
const cors = require('cors');
const db = require('./models');
const bidRoutes = require('./routes/bidRoutes');
const { testConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/bids', bidRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'bid-service' });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    // Initialize the database 
    await db.initialize();
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`Bid service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start bid service:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down bid service...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down bid service...');
  process.exit(0);
});

// Start the server
startServer(); 