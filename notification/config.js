require('dotenv').config();

module.exports = {
    notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3002',
    kafka: {
        clientId: 'notification-service',
        brokers: process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:9092'],
        groupId: 'notification-group',
        topics: {
            listings: 'listing-events',
            notifications: 'notification-events'
        }
    },
    mailgun: {
        apiKey: process.env.MAILGUN_API_KEY || 'your-mailgun-api-key',
        domain: process.env.MAILGUN_DOMAIN || 'your-mailgun-domain.com',
        from: process.env.EMAIL_FROM || 'OrganMarketplace <no-reply@organmarketplace.com>'
    }
};
