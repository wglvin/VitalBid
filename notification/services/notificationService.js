const axios = require('axios');
const mailgun = require('mailgun-js');
const config = require('../config/config');
const { produceMessage } = require('../kafka/kafkaProducer');
const Notification = require('../models/notificationModel');

const mg = mailgun({
    apiKey: config.mailgun.apiKey,
    domain: config.mailgun.domain
});

const sendNotification = async (userId, message) => {
    try {
        // Create a notification model instance
        const notification = new Notification(userId, 'direct', message);
        
        const response = await axios.post(config.notificationProviders.direct, {
            userId,
            message
        });
        
        // Update notification status
        notification.status = 'sent';
        
        // Publish notification sent event to Kafka
        await produceMessage(config.kafka.topics.notifications, {
            type: 'DirectNotificationSent',
            userId,
            status: 'success',
            timestamp: new Date().toISOString()
        });
        
        return response.data;
    } catch (error) {
        console.error('Failed to send direct notification:', error);
        
        // Publish notification failed event to Kafka
        await produceMessage(config.kafka.topics.notifications, {
            type: 'DirectNotificationFailed',
            userId,
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
        });
        
        throw new Error('Failed to send notification');
    }
};

// Function to simulate getting user email from database
const simulateGetUserEmailFromDatabase = async (userId) => {
    // This would normally query a database
    // For demonstration purposes, we'll use a simple object to simulate a database
    const mockUserDatabase = {
        '1': 'moses.kng.2023@smu.edu.sg',
        '2': 'test.user@example.com',
        '3': 'another.user@example.com'
    };
    
    const email = mockUserDatabase[userId];
    if (!email) {
        throw new Error(`User ${userId} not found in database`);
    }
    
    return email;
};

// Enhanced function to handle both userId and direct email
const sendDynamicEmailNotification = async (userIdOrEmail, subject, text) => {
    try {
        // Determine if we have a userId or an email address
        let email = userIdOrEmail;
        let userId = null;
        
        // Check if this looks like an email address
        if (!userIdOrEmail.includes('@')) {
            // If not an email, treat as userId and look up
            userId = userIdOrEmail;
            email = await simulateGetUserEmailFromDatabase(userId);
        }
        
        // Send the email
        const data = {
            from: config.mailgun.from,
            to: email,
            subject: subject,
            text: text
        };

        const response = await mg.messages().send(data);
        console.log(`Email sent to ${email}${userId ? ` (user ${userId})` : ''}: ${response.id}`);
        
        // Publish notification sent event to Kafka
        await produceMessage(config.kafka.topics.notifications, {
            type: 'NotificationSent',
            email,
            userId,
            status: 'success',
            messageId: response.id,
            timestamp: new Date().toISOString()
        });
        
        return response;
    } catch (error) {
        const errorMsg = userId ? 
            `Failed to send dynamic email to user ${userId}` : 
            `Failed to send email to ${userIdOrEmail}`;
        
        console.error(errorMsg, error);
        
        // Publish notification failed event to Kafka
        await produceMessage(config.kafka.topics.notifications, {
            type: 'DynamicNotificationFailed',
            email: userIdOrEmail,
            userId,
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
        });
        
        throw new Error(`${errorMsg}: ${error.message}`);
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

        await sendDynamicEmailNotification(email, subject, text);
        return { status: 'success', message: 'Listing notification sent' };
    } catch (error) {
        console.error('Error processing listing created event:', error);
        throw error;
    }
};

module.exports = {
    sendNotification,
    sendDynamicEmailNotification,
    processListingCreatedEvent
};
