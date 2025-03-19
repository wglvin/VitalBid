const express = require('express');
const cors = require('cors');
const db = require('./models');
const listingRoutes = require('./routes/listingRoutes');
const organRoutes = require('./routes/organRoutes');
const listingService = require('./services/listingService');
const { testConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/listings', listingRoutes);
app.use('/api/organs', organRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'listing-service' });
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
      console.log(`Listing service running on port ${PORT}`);
      
      // Start the listing resolution scheduler
      const resolutionIntervalMinutes = process.env.RESOLUTION_INTERVAL_MINUTES || 5;
      listingService.startResolutionScheduler(parseInt(resolutionIntervalMinutes));
    });
  } catch (error) {
    console.error('Failed to start listing service:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down listing service...');
  listingService.stopResolutionScheduler();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down listing service...');
  listingService.stopResolutionScheduler();
  process.exit(0);
});

// Start the server
startServer(); 