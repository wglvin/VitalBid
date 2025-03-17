const { Kafka } = require('kafkajs');
const config = require('./config');

const kafka = new Kafka({
    clientId: config.kafka.clientId,
    brokers: config.kafka.brokers
});

const producer = kafka.producer();
let isProducerConnected = false;

const connectProducer = async () => {
    if (!isProducerConnected) {
        await producer.connect();
        isProducerConnected = true;
        console.log('Kafka producer connected');
    }
};

const produceMessage = async (topic, message) => {
    try {
        await connectProducer();
        
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
    } catch (error) {
        console.error(`Error producing message to ${topic}:`, error);
        throw error;
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
