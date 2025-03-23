const express = require('express');
const cors = require('cors');
const db = require('./models');
const resolutionRoutes = require('./routes/resolutionRoutes');
const resolutionService = require('./services/resolutionService');
const { testConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/resolutions', resolutionRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'resolve-service' });
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
      console.log(`Resolution service running on port ${PORT}`);
      
      // Start the resolution scheduler
      const resolutionIntervalMinutes = process.env.RESOLUTION_INTERVAL_MINUTES || 1;
      resolutionService.startResolutionScheduler(parseInt(resolutionIntervalMinutes));
    });
  } catch (error) {
    console.error('Failed to start resolution service:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down resolution service...');
  resolutionService.stopResolutionScheduler();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down resolution service...');
  resolutionService.stopResolutionScheduler();
  process.exit(0);
});

// Start the server
startServer(); 