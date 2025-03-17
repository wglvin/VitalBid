const { Kafka } = require('kafkajs');
const config = require('./config');
const { processListingCreatedEvent } = require('./notificationService');

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
            fromBeginning: false 
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
    } catch (error) {
        console.error('Error setting up Kafka consumer:', error);
        throw error;
    }
};

module.exports = {
    setupKafkaConsumer
};
