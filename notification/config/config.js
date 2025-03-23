// Load environment variables from parent directory if running locally
require('dotenv').config({ path: process.env.NODE_ENV ? null : '../../.env' });

module.exports = {
    notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003',
    kafka: {
        clientId: 'notification',
        brokers: process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:9092'],
        groupId: 'notification-group',
        topics: {
            listings: 'listing-events',
            notifications: 'notification-events'
        }
    },
    mailgun: {
        apiKey: process.env.MAILGUN_API_KEY,
        domain: process.env.MAILGUN_DOMAIN,
        from: process.env.EMAIL_FROM || 'noreply@example.com'
    }
};
