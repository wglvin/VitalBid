const { Kafka, Partitioners } = require('kafkajs');
const config = require('../config/config');

const kafka = new Kafka({
    clientId: config.kafka.clientId,
    brokers: config.kafka.brokers
});

// Fix the partitioner warning by setting the legacy partitioner
const producer = kafka.producer({ 
    createPartitioner: Partitioners.LegacyPartitioner 
});

let isProducerConnected = false;

const connectProducer = async () => {
    try {
        if (!isProducerConnected) {
            await producer.connect();
            isProducerConnected = true;
            console.log('Kafka producer connected');
        }
    } catch (error) {
        console.warn(`Failed to connect Kafka producer: ${error.message}`);
        // Don't throw, allow service to continue without Kafka
    }
};

const produceMessage = async (topic, message) => {
    try {
        await connectProducer();
        
        if (!isProducerConnected) {
            console.log(`[KAFKA DISABLED] Would have published to topic ${topic}:`, message);
            return { status: 'skipped', reason: 'kafka_not_connected' };
        }
        
        await producer.send({
            topic,
            messages: [
                { 
                    value: JSON.stringify(message),
                    key: message.type 
                }
            ],
        });
        
        console.log(`Message published to topic ${topic}:`, message);
        return { status: 'success' };
    } catch (error) {
        console.error(`Error producing message to ${topic}:`, error);
        // Don't throw, return error info instead
        return { status: 'error', error: error.message };
    }
};

// Graceful shutdown
const shutdown = async () => {
    if (isProducerConnected) {
        await producer.disconnect();
        isProducerConnected = false;
        console.log('Kafka producer disconnected');
    }
};

// Handle application shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received');
    await shutdown();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT signal received');
    await shutdown();
    process.exit(0);
});

module.exports = {
    produceMessage
};
