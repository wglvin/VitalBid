module.exports = {
  kafka: {
    brokerUrl: process.env.KAFKA_BROKER_URL || 'kafka:9092',
    topics: {
      notifications: process.env.KAFKA_NOTIFICATIONS_TOPIC || 'notification-events',
      bids: process.env.KAFKA_BID_TOPIC || 'bid-events'  // Changed from 'bid' to 'bids'
    }
  }
};
