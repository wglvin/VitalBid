const express = require('express');
const bodyParser = require('body-parser');
const transactionController = require('./transactionController');

const app = express();
app.use(bodyParser.json());

app.post('/transactions', transactionController.createTransaction);
app.get('/transactions/:id', transactionController.getTransaction);

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`Transaction Service running on port ${PORT}`);
});
