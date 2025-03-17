const axios = require('axios');
const mailgun = require('mailgun-js');
const config = require('./config');
const { produceMessage } = require('./kafkaProducer');

const mg = mailgun({
    apiKey: config.mailgun.apiKey,
    domain: config.mailgun.domain
});

const sendNotification = async (userId, message) => {
    try {
        const response = await axios.post('https://example.com/send', {
            userId,
            message
        });
        return response.data;
    } catch (error) {
        throw new Error('Failed to send notification');
    }
};

const sendEmailNotification = async (email, subject, text) => {
    try {
        const data = {
            from: config.mailgun.from,
            to: email,
            subject: subject,
            text: text
        };

        const response = await mg.messages().send(data);
        console.log(`Email sent to ${email}: ${response.id}`);
        
        // Publish notification sent event to Kafka
        await produceMessage(config.kafka.topics.notifications, {
            type: 'NotificationSent',
            email,
            status: 'success',
            messageId: response.id,
            timestamp: new Date().toISOString()
        });
        
        return response;
    } catch (error) {
        console.error('Failed to send email notification:', error);
        
        // Publish notification failed event to Kafka
        await produceMessage(config.kafka.topics.notifications, {
            type: 'NotificationFailed',
            email,
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
        });
        
        throw new Error('Failed to send email notification');
    }
};

const processListingCreatedEvent = async (listing) => {
    try {
        const { userId, email, title, description } = listing;
        
        const subject = 'Your Organ Listing Has Been Created';
        const text = `Hello,
        
Your listing "${title}" has been successfully created in the Organ Marketplace.

Listing Details:
Title: ${title}
Description: ${description}

Thank you for using Organ Marketplace!

Best regards,
The Organ Marketplace Team`;

        await sendEmailNotification(email, subject, text);
        return { status: 'success', message: 'Listing notification sent' };
    } catch (error) {
        console.error('Error processing listing created event:', error);
        throw error;
    }
};

module.exports = {
    sendNotification,
    sendEmailNotification,
    processListingCreatedEvent
};
