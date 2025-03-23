require('dotenv').config();
const { Kafka } = require('kafkajs');

// Detect if running in Docker or locally and adjust broker addresses
const isDocker = process.env.IS_DOCKER === 'true';
const KAFKA_BROKERS = isDocker ? 
    (process.env.KAFKA_BROKERS || 'kafka:9092').split(',') : 
    ['localhost:9092']; // Use localhost when running on host machine

console.log(`Running in ${isDocker ? 'Docker' : 'local'} mode`);
console.log(`Using Kafka brokers: ${KAFKA_BROKERS.join(', ')}`);

const TOPIC = 'listing-events';

// Parse command line arguments
const args = process.argv.slice(2);
const eventType = args[0] || 'ListingCreated';
const listingId = args[1] || '12345';
const title = args[2] || 'Test Organ Listing';

// Create Kafka client
const kafka = new Kafka({
  clientId: 'notification-test-producer',
  brokers: KAFKA_BROKERS
});

const producer = kafka.producer();

async function sendTestMessage() {
  try {
    console.log(`Connecting to Kafka brokers: ${KAFKA_BROKERS.join(', ')}`);
    await producer.connect();
    console.log('Connected to Kafka');
    
    // Create a test message based on the event type
    const message = {
      type: eventType,
      data: {
        id: listingId,
        title: title,
        description: 'This is a test listing created for Kafka testing',
        userId: '1',
        email: 'moses.kng.2023@smu.edu.sg',
        price: 1000,
        status: 'active',
        createdAt: new Date().toISOString()
      }
    };
    
    console.log(`Sending test message to topic "${TOPIC}":`, JSON.stringify(message, null, 2));
    
    // Send the message
    await producer.send({
      topic: TOPIC,
      messages: [
        { 
          value: JSON.stringify(message),
          key: eventType
        }
      ],
    });
    
    console.log('Message sent successfully!');
    
    // Close the producer
    await producer.disconnect();
    console.log('Producer disconnected');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

sendTestMessage();
