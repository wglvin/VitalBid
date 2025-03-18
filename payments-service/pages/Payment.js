// pages/Payment.js
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import PaymentForm from '../components/PaymentForm';

const stripePromise = loadStripe('pk_test_51R2REVRoJbU4bIcvlsl3kwcRAEDMEdO6zZ0wAGV9nJhIfpKaJTiyN8rAmvoOXYGl0oXsZDGv3eBP1KEfGqXTCJzT000fu9PlVV');

const Payment = () => {
  const location = useLocation();
  const [bidDetails, setBidDetails] = useState(null);
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const bidId = params.get('bidId');
    const amount = parseFloat(params.get('amount'));
    
    if (bidId && amount) {
      setBidDetails({ bidId, amount });
    }
  }, [location.search]);
  
  const handlePaymentComplete = () => {
    // Redirect to success page or bid history
    window.location.href = '/my-bids';
  };
  
  if (!bidDetails) {
    return <div>Loading payment details...</div>;
  }
  
  return (
    <div className="payment-page">
      <h1>Complete Your Payment</h1>
      <p>Bid ID: {bidDetails.bidId}</p>
      <Elements stripe={stripePromise}>
        <PaymentForm 
          amount={bidDetails.amount} 
          bidId={bidDetails.bidId}
          onPaymentComplete={handlePaymentComplete}
        />
      </Elements>
    </div>
  );
};