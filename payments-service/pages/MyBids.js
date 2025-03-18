// pages/MyBids.js
import { useState, useEffect } from 'react';
import { getUserBids } from '../services/bidService';

const MyBids = () => {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchBids = async () => {
      try {
        const userId = "current-user-id"; // Get from auth context
        const response = await getUserBids(userId);
        setBids(response.data);
      } catch (error) {
        console.error('Error fetching bids:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBids();
  }, []);
  
  if (loading) return <div>Loading your bids...</div>;
  
  return (
    <div className="my-bids">
      <h1>My Bids</h1>
      <table>
        <thead>
          <tr>
            <th>Listing</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {bids.map(bid => (
            <tr key={bid.id}>
              <td>{bid.listing_name}</td>
              <td>${bid.amount}</td>
              <td>{bid.status}</td>
              <td>{new Date(bid.created_at).toLocaleDateString()}</td>
              <td>
                {bid.status === 'pending_payment' && (
                  <button onClick={() => window.location.href = `/payment?bidId=${bid.id}&amount=${bid.amount}`}>
                    Pay Now
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};