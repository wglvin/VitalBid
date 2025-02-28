const express = require('express');
const router = express.Router();
const ordersController = require('./ordersController');

// Create an order
router.post('/', ordersController.createOrder);

// Get an order
router.get('/:id', ordersController.getOrder);

// Update an order (e.g., status)
router.put('/:id', ordersController.updateOrder);

module.exports = router;
