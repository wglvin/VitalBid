const { Kafka } = require('kafkajs');
const config = require('../config/config');
const { processListingCreatedEvent } = require('../services/notificationService');

const kafka = new Kafka({
    clientId: config.kafka.clientId,
    brokers: config.kafka.brokers,
    retry: {
        initialRetryTime: 1000,
        retries: 10
    }
});

const consumer = kafka.consumer({ groupId: config.kafka.groupId });

const setupKafkaConsumer = async () => {
    try {
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        console.log(`Connecting to Kafka brokers: ${config.kafka.brokers}`);
        await consumer.connect();
        console.log('Connected to Kafka');

        await consumer.subscribe({ 
            topic: config.kafka.topics.listings, 
            fromBeginning: true
        });
        console.log(`Subscribed to topic: ${config.kafka.topics.listings}`);

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    const messageValue = JSON.parse(message.value.toString());
                    
                    if (messageValue.type === 'ListingCreated') {
                        await processListingCreatedEvent(messageValue.data);
                    }
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
        return false;
    }
};

module.exports = {
    setupKafkaConsumer
};
