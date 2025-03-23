const { Kafka } = require('kafkajs');

// Get Kafka configuration from environment variables
const KAFKA_BROKERS = process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['kafka:9092'];
const LISTING_EVENTS_TOPIC = process.env.LISTING_EVENTS_TOPIC || 'listing-events';

// Create Kafka client
const kafka = new Kafka({
    clientId: 'listing-service',
    brokers: KAFKA_BROKERS
});

const producer = kafka.producer();
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
    }
};

const produceMessage = async (type, data) => {
    try {
        await connectProducer();
        
        if (!isProducerConnected) {
            console.log(`[KAFKA DISABLED] Would have published event ${type}:`, data);
            return { status: 'skipped', reason: 'kafka_not_connected' };
        }
        
        const message = {
            type,
            data,
            timestamp: new Date().toISOString()
        };
        
        await producer.send({
            topic: LISTING_EVENTS_TOPIC,
            messages: [{ 
                value: JSON.stringify(message),
                key: type
            }]
        });
        
        console.log(`Published ${type} event to Kafka:`, data);
        return { status: 'success' };
    } catch (error) {
        console.error(`Error producing Kafka message: ${error.message}`);
        return { status: 'error', error: error.message };
    }
};

const shutdown = async () => {
    if (isProducerConnected) {
        await producer.disconnect();
        isProducerConnected = false;
        console.log('Kafka producer disconnected');
    }
};

// Handle application shutdown
process.on('SIGTERM', async () => {
    await shutdown();
});

process.on('SIGINT', async () => {
    await shutdown();
});

module.exports = {
    produceMessage
};
