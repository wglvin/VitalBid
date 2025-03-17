const express = require('express');
const bodyParser = require('body-parser');
const notificationRoutes = require('./routes/notificationRoutes');
const { setupKafkaConsumer } = require('./kafka/kafkaConsumer');
const config = require('./config/config');

const app = express();
app.use(bodyParser.json());

// Use routes
app.use('/', notificationRoutes);

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`Notification service running on port ${PORT}`);
    
    // Set up Kafka consumer after server starts
    setupKafkaConsumer().catch(error => {
        console.error('Failed to setup Kafka consumer:', error);
        process.exit(1);
    });
});
