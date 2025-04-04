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

// Connect to Kafka on service initialization
const connect = async () => {
  try {
    await producer.connect();
    isConnected = true;
    console.log('Connected to Kafka');
  } catch (error) {
    console.error('Failed to connect to Kafka:', error);
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
    if (!isConnected) {
      await connect();
    }
    
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }]
    });
    
    console.log(`Message sent to Kafka topic ${topic}`);
    return true;
  } catch (error) {
    console.error(`Failed to send message to Kafka topic ${topic}:`, error);
    return false;
  }
};

// Initialize connection
connect();

// Handle process termination
process.on('SIGTERM', disconnect);
process.on('SIGINT', disconnect);

module.exports = {
  produceMessage,
  connect,
  disconnect
};
