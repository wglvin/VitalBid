// // Test data for creating a payment intent
// {
//     "amount": 50.00,
//     "currency": "usd",
//     "bid_id": "bid_12345"
//   }
  
//   // Alternative test with different currency
//   {
//     "amount": 45.50,
//     "currency": "eur",
//     "bid_id": "bid_67890"
//   }

// # Create a payment intent
// curl -X POST http://localhost:5000/v1/payment_intents \
// -H "Content-Type: application/json" \
 // -d '{"amount": 50.00, "currency": "usd", "bid_id": "bid_12345"}'

// # Confirm a payment intent (replace payment_intent_id with the ID returned from the first request)
// curl -X POST http://localhost:5000/v1/payment_intents/pi_123456789/confirm
