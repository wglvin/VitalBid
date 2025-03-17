const express = require('express');
const bodyParser = require('body-parser');
const { 
    sendNotification, 
    processListingCreatedEvent 
} = require('./notificationService');
const { setupKafkaConsumer } = require('./kafkaConsumer');
const config = require('./config');

const app = express();
app.use(bodyParser.json());

// Direct API endpoint for sending notifications
app.post('/notify', (req, res) => {
    const { userId, message } = req.body;
    sendNotification(userId, message)
        .then(response => res.status(200).send(response))
        .catch(error => res.status(500).send(error));
});

// API endpoint for sending email notifications
app.post('/notify/email', (req, res) => {
    const { email, subject, text } = req.body;
    sendEmailNotification(email, subject, text)
        .then(response => res.status(200).send({ status: 'success', messageId: response.id }))
        .catch(error => res.status(500).send({ status: 'error', message: error.message }));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send({ status: 'UP', service: 'notification-service' });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`Notification service running on port ${PORT}`);
    
    // Set up Kafka consumer after server starts
    setupKafkaConsumer().catch(error => {
        console.error('Failed to setup Kafka consumer:', error);
        process.exit(1);
    });
});
