const { Kafka } = require('kafkajs');
const config = require('../config/config');
const { processListingCreatedEvent, processBidAcceptedEvent } = require('../services/notificationService');

// Debug connection information
console.log('🔌 Configuring Kafka consumer with brokers:', config.kafka.brokers);

const kafka = new Kafka({
    clientId: config.kafka.clientId,
    brokers: config.kafka.brokers,
    retry: {
        initialRetryTime: 1000,
        retries: 10
    }
});

const consumer = kafka.consumer({ 
    groupId: config.kafka.groupId,
    retry: { retries: 10 }
});

const setupKafkaConsumer = async () => {
    try {
        console.log('Waiting for Kafka to be ready...');
        await new Promise(resolve => setTimeout(resolve, 15000));
        
        // Test direct connection to broker first
        try {
            const net = require('net');
            const socket = new net.Socket();
            
            // Get first broker from config
            const [host, port] = config.kafka.brokers[0].split(':');
            console.log(`Testing direct TCP connection to ${host}:${port}...`);
            
            await new Promise((resolve, reject) => {
                socket.connect(parseInt(port), host, () => {
                    console.log(`✅ Successfully connected to ${host}:${port}`);
                    socket.end();
                    resolve();
                });
                
                socket.on('error', (err) => {
                    console.error(`❌ Failed to connect to ${host}:${port}: ${err.message}`);
                    reject(err);
                });
            });
        } catch (netErr) {
            console.warn(`Network test failed: ${netErr.message}`);
        }
        
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
        console.error(`Failed to setup Kafka consumer: ${error.message}`, error);
        console.warn('Event-driven notifications will be disabled, but API endpoints will still work');
        return false;
    }
};

module.exports = {
    setupKafkaConsumer
};
