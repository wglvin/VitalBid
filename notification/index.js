const express = require('express');
const bodyParser = require('body-parser');
const notificationRoutes = require('./routes/notificationRoutes');
const { setupKafkaConsumer } = require('./kafka/kafkaConsumer');
const config = require('./config/config');

const app = express();
app.use(bodyParser.json());

// Add a root route for basic health check
app.get('/', (req, res) => {
    res.status(200).send({
        service: 'notification',
        status: 'running',
        message: 'Welcome to the Notification Service',
        endpoints: [
            '/notify - Send direct notifications',
            '/notify/email - Send email with direct email address',
            '/notify/email/user/:userId - Send email using user ID',
            '/health - Service health check'
        ]
    });
});

// Use routes
app.use('/', notificationRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Notification service running on port ${PORT}`);
    
    // Set up Kafka consumer after server starts but don't crash if it fails
    setupKafkaConsumer().catch(error => {
        console.warn(`Kafka setup failed: ${error.message}`);
        console.warn('Continuing without Kafka event processing - API endpoints will still work');
    });
});
