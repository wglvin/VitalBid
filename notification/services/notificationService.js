const axios = require('axios');
const config = require('../config/config');
const { produceMessage } = require('../kafka/kafkaProducer');
const Notification = require('../models/notificationModel');

// Function to simulate getting user email from database when only ID is available
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
        // For users not in our mock database, use a generated email based on ID
        const generatedEmail = `user${userId}@organdonation.com`;
        console.log(`User ${userId} not found in database, using generated email: ${generatedEmail}`);
        return generatedEmail;
    }
    
    return email;
};

// Updated function to exactly match the Python example structure
const sendDynamicEmailNotification = async (userIdOrEmail, subject, text) => {
    let email = userIdOrEmail;
    let userId = null;
    
    try {
        // Check if this looks like an email address
        if (!userIdOrEmail.includes('@')) {
            // If not an email, treat as userId and look up
            userId = userIdOrEmail;
            email = await simulateGetUserEmailFromDatabase(userId);
        }
        
        // Use the Python-style exact API call to Mailgun
        const mailgunUrl = `https://api.mailgun.net/v3/${config.mailgun.domain}/messages`;
        
        // Create form data exactly as in the Python example
        const formData = new URLSearchParams();
        formData.append('from', config.mailgun.from);
        formData.append('to', email);
        formData.append('subject', subject);
        formData.append('text', text);
        
        console.log(`Sending email to ${email} via ${mailgunUrl}`);
        
        // Make the API call exactly as in Python example
        const response = await axios.post(
            mailgunUrl,
            formData,
            {
                auth: {
                    username: 'api',
                    password: config.mailgun.apiKey
                }
            }
        );
        
        console.log(`Email sent successfully to ${email}`);
        
        // Try to publish to Kafka but don't fail if it doesn't work
        await produceMessage(config.kafka.topics.notifications, {
            type: 'NotificationSent',
            email,
            userId: userId || null,
            status: 'success',
            messageId: response.data.id,
            timestamp: new Date().toISOString()
        }).catch(err => console.warn('Kafka publish failed:', err.message));
        
        return response.data;
    } catch (error) {
        const errorMsg = userId ? 
            `Failed to send dynamic email to user ${userId}` : 
            `Failed to send email to ${email}`;
        
        console.error(errorMsg);
        
        // Log detailed error information
        if (error.response) {
            console.error('Mailgun API error status:', error.response.status);
            console.error('Mailgun API error data:', error.response.data);
        } else {
            console.error('Error details:', error.message);
        }
        
        // Try to publish to Kafka but don't fail if it doesn't work
        await produceMessage(config.kafka.topics.notifications, {
            type: 'DynamicNotificationFailed',
            email: email,
            userId: userId || null,
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
        }).catch(err => console.warn('Kafka publish failed:', err.message));
        
        throw new Error(`${errorMsg}: ${error.message}`);
    }
};

const processListingCreatedEvent = async (listing) => {
    try {
        const { userId, title, description } = listing;
        
        // Prioritize the email from the Kafka message
        let email = listing.email;
        
        // Only fall back to database lookup if no email was provided
        if (!email || !email.includes('@')) {
            console.log(`No valid email in message, looking up email for user ${userId}`);
            email = await simulateGetUserEmailFromDatabase(userId);
        }
        
        const username = listing.username || `User ${userId || 'unknown'}`;
        
        const greeting = username ? `Hello ${username},` : 'Hello,';
        
        const subject = 'Your Organ Listing Has Been Created';
        const text = `${greeting}
        
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

const processBidAcceptedEvent = async (event) => {
    try {
        console.log('Processing bid accepted event:', JSON.stringify(event));
        
        if (!event) {
            throw new Error('Event object is undefined');
        }
        
        const { bidderId, bidAmount, email, username } = event;
        
        if (!bidderId) {
            console.warn('No bidderId found in event, event data:', JSON.stringify(event));
        }
        
        // If email is available from the event, use it
        let recipientEmail = email;
        let recipientName = username || `User ${bidderId}`;
        
        // If no email provided, attempt to look up the bidder's email
        if (!recipientEmail || !recipientEmail.includes('@')) {
            console.log(`No valid email in event, looking up email for user ${bidderId}`);
            recipientEmail = await simulateGetUserEmailFromDatabase(bidderId);
        }
        
        const greeting = recipientName ? `Hello ${recipientName},` : 'Hello,';
        
        const subject = 'Your Bid Was Accepted!';
        const text = `${greeting}
        
Congratulations! Your bid of $${bidAmount} has been accepted.

Please proceed to payment to complete the transaction.

Thank you for using Organ Marketplace!

Best regards,
The Organ Marketplace Team`;

        await sendDynamicEmailNotification(recipientEmail, subject, text);
        return { status: 'success', message: 'Bid acceptance notification sent' };
    } catch (error) {
        console.error('Error processing bid accepted event:', error);
        console.error('Event data:', JSON.stringify(event));
        throw error;
    }
};

module.exports = {
    sendDynamicEmailNotification,
    processListingCreatedEvent,
    processBidAcceptedEvent
};
