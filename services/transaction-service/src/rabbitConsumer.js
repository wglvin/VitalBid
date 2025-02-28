const amqp = require('amqplib');

async function consumeMessages() {
  try {
    const connection = await amqp.connect('amqp://admin:admin@rabbitmq:5672');
    const channel = await connection.createChannel();

    // Make sure queue exists
    await channel.assertQueue('TRANSACTION_QUEUE', { durable: true });

    console.log(" [*] Waiting for messages in TRANSACTION_QUEUE. To exit press CTRL+C");

    channel.consume('TRANSACTION_QUEUE', (msg) => {
      if (msg !== null) {
        const content = msg.content.toString();
        console.log("[x] Received:", content);

        // Process the transaction message here...
        // e.g., update DB, confirm payment, etc.

        channel.ack(msg);  // Acknowledge after processing
      }
    });
  } catch (error) {
    console.error("Error in RabbitMQ consumer:", error);
  }
}

consumeMessages();

let transactionDB = {};

async function publishToQueue(queue, message) {
  try {
    const connection = await amqp.connect('amqp://admin:admin@rabbitmq:5672');
    const channel = await connection.createChannel();
    await channel.assertQueue(queue, { durable: true });
    channel.sendToQueue(queue, Buffer.from(message), { persistent: true });
    console.log(" [x] Sent '%s'", message);
    await channel.close();
    await connection.close();
  } catch (error) {
    console.error("Failed to publish message:", error);
  }
}

exports.createTransaction = async (req, res) => {
  const { id, amount, userId } = req.body;
  if (!id || !amount || !userId) {
    return res.status(400).send({ error: 'Missing transaction data' });
  }
  transactionDB[id] = { id, amount, userId, status: 'pending' };

  // Simulate a payment success
  transactionDB[id].status = 'completed';

  // Publish an event to RabbitMQ
  await publishToQueue('TRANSACTION_QUEUE', JSON.stringify(transactionDB[id]));

  return res.status(201).send({
    message: 'Transaction created',
    transaction: transactionDB[id]
  });
};

exports.getTransaction = (req, res) => {
  const txn = transactionDB[req.params.id];
  if (!txn) return res.status(404).send({ error: 'Transaction not found' });
  return res.send(txn);
};