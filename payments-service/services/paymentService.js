// services/paymentService.js
import axios from 'axios';

const PAYMENT_API_URL = 'http://your-payment-service-url/v1';

export const createPaymentIntent = async (amount, bidId) => {
  return axios.post(`${PAYMENT_API_URL}/payment_intents`, {
    amount,
    currency: 'usd',
    bid_id: bidId
  }).then(response => response.data);
};

export const confirmPayment = async (paymentIntentId) => {
  return axios.post(`${PAYMENT_API_URL}/payment_intents/${paymentIntentId}/confirm`)
    .then(response => response.data);
};