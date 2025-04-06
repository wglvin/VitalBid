const { Kafka } = require('kafkajs');
const config = require('../config');

// Create Kafka client
const kafka = new Kafka({
  clientId: 'resolve-service',
  brokers: [config.kafka.brokerUrl || 'kafka:9092']
});

// Create producer
const producer = kafka.producer();
let isConnected = false;

// Connect to Kafka only when needed
const connect = async () => {
  try {
    if (!isConnected) {
      await producer.connect();
      isConnected = true;
      console.log('Connected to Kafka');
    }
    return true;
  } catch (error) {
    console.error('Failed to connect to Kafka:', error);
    return false;
  }
};

// Disconnect from Kafka when service shuts down
const disconnect = async () => {
  if (isConnected) {
    try {
      await producer.disconnect();
      isConnected = false;
      console.log('Disconnected from Kafka');
    } catch (error) {
      console.error('Failed to disconnect from Kafka:', error);
    }
  }
};

// Send message to Kafka topic
const produceMessage = async (topic, message) => {
  try {
    // Try to connect if not already connected
    await connect();
    
    if (!isConnected) {
      console.log(`[KAFKA DISABLED] Would have sent message to topic ${topic}:`, message);
      return { status: 'skipped', reason: 'kafka_not_connected' };
    }
    
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }]
    });
    
    console.log(`Message sent to Kafka topic ${topic}`);
    return { status: 'success' };
  } catch (error) {
    console.error(`Failed to send message to Kafka topic ${topic}:`, error);
    return { status: 'error', error: error.message };
  }
};

// No longer initialize connection at startup
// connect();  <- removed this line

// Handle process termination
process.on('SIGTERM', disconnect);
process.on('SIGINT', disconnect);

module.exports = {
  produceMessage,
  connect,
  disconnect
};
