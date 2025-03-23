const { Kafka } = require('kafkajs');
const config = require('../config/config');
const { processListingCreatedEvent } = require('../services/notificationService');

const kafka = new Kafka({
    clientId: config.kafka.clientId,
    brokers: config.kafka.brokers
});

const consumer = kafka.consumer({ groupId: config.kafka.groupId });

const setupKafkaConsumer = async () => {
    try {
        await consumer.connect();
        console.log('Connected to Kafka');

        // Subscribe to the listings topic
        await consumer.subscribe({ 
            topic: config.kafka.topics.listings, 
            fromBeginning: true  // Changed to true to consume existing messages for testing
        });
        console.log(`Subscribed to topic: ${config.kafka.topics.listings}`);

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    const messageValue = JSON.parse(message.value.toString());
                    console.log(`Received Kafka message: ${JSON.stringify(messageValue)}`);
                    
                    // Process different event types
                    if (messageValue.type === 'ListingCreated') {
                        await processListingCreatedEvent(messageValue.data);
                    }
                    // Add additional event types as needed
                } catch (error) {
                    console.error('Error processing Kafka message:', error);
                }
            },
        });

        console.log('Kafka consumer is running');
        return true;
    } catch (error) {
        console.warn(`Failed to setup Kafka consumer: ${error.message}`);
        console.warn('Event-driven notifications will be disabled, but API endpoints will still work');
        // Don't rethrow, return false instead
        return false;
    }
};

module.exports = {
    setupKafkaConsumer
};
