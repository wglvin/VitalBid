require('dotenv').config();
const { Kafka } = require('kafkajs');

// Detect if running in Docker or locally and adjust broker addresses
const isDocker = process.env.IS_DOCKER === 'true';
const KAFKA_BROKERS = isDocker ? 
    (process.env.KAFKA_BROKERS || 'kafka:9092').split(',') : 
    ['localhost:9092']; // Use localhost when running on host machine

console.log(`Running in ${isDocker ? 'Docker' : 'local'} mode`);
console.log(`Using Kafka brokers: ${KAFKA_BROKERS.join(', ')}`);

const GROUP_ID = 'test-consumer-group';
const TOPIC = process.argv[2] || 'listing-events';

// Create Kafka client
const kafka = new Kafka({
  clientId: 'test-consumer',
  brokers: KAFKA_BROKERS
});

const consumer = kafka.consumer({ groupId: GROUP_ID });

async function startConsumer() {
  try {
    console.log(`Connecting to Kafka brokers: ${KAFKA_BROKERS.join(', ')}`);
    await consumer.connect();
    console.log('Connected to Kafka');
    
    console.log(`Subscribing to topic: ${TOPIC}`);
    await consumer.subscribe({ topic: TOPIC, fromBeginning: true });
    
    console.log('Starting consumer...');
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        console.log('-------------------------------------');
        console.log('Received message:');
        console.log(`Topic: ${topic}, Partition: ${partition}`);
        console.log(`Key: ${message.key ? message.key.toString() : null}`);
        console.log(`Value: ${message.value ? message.value.toString() : null}`);
        console.log(`Headers:`, message.headers);
        console.log('-------------------------------------');
      },
    });
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  try {
    console.log('Disconnecting consumer...');
    await consumer.disconnect();
    console.log('Consumer disconnected');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

console.log(`Starting test consumer for topic: ${TOPIC}`);
console.log('Press Ctrl+C to exit');
startConsumer();
