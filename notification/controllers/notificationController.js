const { 
    sendDynamicEmailNotification,
    processListingCreatedEvent,
    processBidAcceptedEvent
} = require('../services/notificationService');

// Repurpose the sendEmail function to use sendDynamicEmailNotification
const sendEmail = async (req, res) => {
    try {
        const { email, subject, text } = req.body;
        const response = await sendDynamicEmailNotification(email, subject, text);
        res.status(200).send({ status: 'success', messageId: response.id });
    } catch (error) {
        res.status(500).send({ status: 'error', message: error.message });
    }
};

const sendDynamicEmail = async (req, res) => {
    try {
        const { userId } = req.params;
        const { subject, text } = req.body;
        
        const response = await sendDynamicEmailNotification(userId, subject, text);
        res.status(200).send({ 
            status: 'success', 
            message: `Email sent to user ${userId}`,
            messageId: response.id
        });
    } catch (error) {
        res.status(500).send({ status: 'error', message: error.message });
    }
};

const healthCheck = (req, res) => {
    res.status(200).send({ status: 'UP', service: 'notification' });
};

// Handle Kafka events
const handleKafkaEvent = async (event) => {
    try {
        console.log('Processing Kafka event:', event.type);
        
        switch (event.type) {
            case 'LISTING_CREATED':
                return await processListingCreatedEvent(event);
            case 'BID_ACCEPTED':
                return await processBidAcceptedEvent(event);
            default:
                console.warn('Unknown event type:', event.type);
                return { status: 'ignored', message: 'Unknown event type' };
        }
    } catch (error) {
        console.error('Error handling Kafka event:', error);
        return { status: 'error', message: error.message };
    }
};

module.exports = {
    sendEmail,
    sendDynamicEmail,
    healthCheck,
    handleKafkaEvent
};
