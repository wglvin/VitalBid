class Notification {
    constructor(userId, type, message, status = 'pending', createdAt = new Date()) {
        this.userId = userId;
        this.type = type; // 'email', 'push', 'sms', etc.
        this.message = message;
        this.status = status; // 'pending', 'sent', 'delivered', 'failed'
        this.createdAt = createdAt;
    }

    toJSON() {
        return {
            userId: this.userId,
            type: this.type,
            message: this.message,
            status: this.status,
            createdAt: this.createdAt
        };
    }

    static createFromKafkaEvent(event) {
        const { userId, type, message } = event;
        return new Notification(userId, type, message);
    }
}

module.exports = Notification;
