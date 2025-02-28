const express = require('express');
const bodyParser = require('body-parser');
const ordersRoutes = require('./ordersRoutes');

const app = express();
app.use(bodyParser.json());

// Mount routes
app.use('/orders', ordersRoutes);

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
  console.log(`Orders Service running on port ${PORT}`);
});
