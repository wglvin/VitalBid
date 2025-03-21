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
        apiKey: process.env.MAILGUN_API_KEY || '9365d12bb9c9e3da766d697175b6c81a-3d4b3a2a-c2781184',
        domain: process.env.MAILGUN_DOMAIN || 'sandboxf1dca3939f8f433d966ab0aacf7d7dac.mailgun.org',
        from: process.env.EMAIL_FROM || 'postmaster@sandboxf1dca3939f8f433d966ab0aacf7d7dac.mailgun.org'
    },
    notificationProviders: {
        direct: process.env.DIRECT_NOTIFICATION_URL || 'http://push-notification-service:3005/send',
        push: process.env.PUSH_NOTIFICATION_URL || 'http://push-notification-service:3005/push'
    }
};
