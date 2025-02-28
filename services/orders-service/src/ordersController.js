const ordersService = require('./ordersService');

exports.createOrder = async (req, res) => {
  try {
    const { userId, orderLines } = req.body;
    // orderLines: [{ organId, quantity, price }, ...]

    const newOrder = await ordersService.createOrder(userId, orderLines);
    return res.status(201).json({ message: 'Order created', order: newOrder });
  } catch (error) {
    console.error('Error creating order:', error);
    return res.status(400).json({ error: error.message });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await ordersService.getOrder(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    return res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return res.status(400).json({ error: error.message });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;
    const updated = await ordersService.updateOrderStatus(orderId, status);
    if (!updated) {
      return res.status(404).json({ error: 'Order not found' });
    }
    return res.json({ message: 'Order updated' });
  } catch (error) {
    console.error('Error updating order:', error);
    return res.status(400).json({ error: error.message });
  }
};
