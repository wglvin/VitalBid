// Load environment variables from parent directory if running locally
require('dotenv').config({ path: process.env.NODE_ENV ? null : '../../.env' });

// Extract Kafka brokers from environment variables
const kafkaBrokers = process.env.KAFKA_BROKERS || 'kafka:9092';

module.exports = {
    notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003',
    kafka: {
        clientId: 'notification',
        // Ensure brokers is always an array with the correct format
        brokers: typeof kafkaBrokers === 'string' ? kafkaBrokers.split(',') : ['kafka:9092'],
        groupId: 'notification-group',
        topics: {
            listings: 'listing-events',
            notifications: 'notification-events',
            bids: 'bid-events'
        }
    },
    mailgun: {
        apiKey: process.env.MAILGUN_API_KEY,
        domain: process.env.MAILGUN_DOMAIN,
        from: process.env.EMAIL_FROM || 'noreply@example.com'
    }
};
