// PaymentForm.js
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const PaymentForm = ({ amount, bidId, onPaymentComplete }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Create payment intent
    const paymentIntent = await createPaymentIntent(amount, bidId);
    
    // Confirm payment with Stripe
    const result = await stripe.confirmCardPayment(paymentIntent.client_secret, {
      payment_method: {
        card: elements.getElement(CardElement)
      }
    });
    
    if (result.error) {
      console.error(result.error);
    } else {
      // Confirm payment with your backend
      await confirmPayment(paymentIntent.id);
      onPaymentComplete();
    }
    
    setLoading(false);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <h2>Complete Payment</h2>
      <p>Amount: ${amount}</p>
      <CardElement />
      <button type="submit" disabled={loading || !stripe}>
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
};