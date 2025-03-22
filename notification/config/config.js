require('dotenv').config();

module.exports = {
    notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3002',
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
    },
    notificationProviders: {
        direct: process.env.DIRECT_NOTIFICATION_URL || 'http://push-notification-service:3005/send',
        push: process.env.PUSH_NOTIFICATION_URL || 'http://push-notification-service:3005/push'
    }
};
