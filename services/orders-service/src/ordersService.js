const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const mysql = require('mysql2/promise');

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'orders_user',
  password: process.env.DB_PASS || 'orders_pass',
  database: process.env.DB_NAME || 'orders_db'
});

async function createOrder(userId, orderLines) {
  if (!userId || !Array.isArray(orderLines) || orderLines.length === 0) {
    throw new Error('Invalid input data');
  }

  // 1) Validate User
  // Example call to user-service: GET /users/:id
  // If user-service is code-based on port 3001:
  const userServiceURL = process.env.USER_SERVICE_URL || 'http://user-service:3001/users';
  try {
    const userResp = await axios.get(`${userServiceURL}/${userId}`);
    if (!userResp.data || !userResp.data.id) {
      throw new Error('User not found');
    }
  } catch (err) {
    throw new Error('Failed to validate user: ' + err.message);
  }

  // 2) Validate Organ Availability
  // Example call to organs-service: GET /organs/:id
  const organsServiceURL = process.env.ORGANS_SERVICE_URL || 'http://organs-service:3002/organs';
  for (const line of orderLines) {
    try {
      const organResp = await axios.get(`${organsServiceURL}/${line.organId}`);
      if (!organResp.data || !organResp.data.id) {
        throw new Error(`Organ ${line.organId} not found`);
      }
      if (organResp.data.status !== 'available') {
        throw new Error(`Organ ${line.organId} is not available`);
      }
    } catch (err) {
      throw new Error('Failed to validate organ: ' + err.message);
    }
  }

  // 3) Insert the order in the DB
  const orderId = uuidv4();
  let totalAmount = 0;
  orderLines.forEach(line => {
    totalAmount += (line.price || 0) * (line.quantity || 1);
  });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [orderResult] = await conn.query(
      `INSERT INTO orders (id, user_id, total_amount, status) VALUES (?,?,?,?)`,
      [orderId, userId, totalAmount, 'pending']
    );

    // 4) Insert order lines
    for (const line of orderLines) {
      const orderLineId = uuidv4();
      await conn.query(
        `INSERT INTO order_lines (id, order_id, organ_id, quantity, price)
         VALUES (?,?,?,?,?)`,
        [orderLineId, orderId, line.organId, line.quantity || 1, line.price || 0]
      );
    }

    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }

  // 5) (Optional) Payment / Transaction
  // Example: POST /transactions
  const transactionServiceURL = process.env.TRANSACTION_SERVICE_URL || 'http://transaction-service:3003/transactions';
  try {
    const txnId = uuidv4();
    const txnResp = await axios.post(`${transactionServiceURL}`, {
      id: txnId,
      userId: userId,
      amount: totalAmount
    });
    // If successful, update order status to "paid"
    if (txnResp.data && txnResp.data.transaction && txnResp.data.transaction.status === 'completed') {
      await updateOrderStatus(orderId, 'paid');
    }
  } catch (err) {
    console.error('Payment failed or not required:', err.message);
  }

  // 6) (Optional) Publish event to Kafka/RabbitMQ
  // e.g., "OrderCreated" event

  return { id: orderId, userId, totalAmount, status: 'pending' };
}

async function getOrder(orderId) {
  const [rows] = await pool.query(`SELECT * FROM orders WHERE id = ?`, [orderId]);
  if (!rows || rows.length === 0) {
    return null;
  }

  const order = rows[0];
  const [lineRows] = await pool.query(`SELECT * FROM order_lines WHERE order_id = ?`, [orderId]);
  order.lines = lineRows;
  return order;
}

async function updateOrderStatus(orderId, status) {
  const [result] = await pool.query(`UPDATE orders SET status = ? WHERE id = ?`, [status, orderId]);
  return result.affectedRows > 0;
}

module.exports = {
  createOrder,
  getOrder,
  updateOrderStatus
};
