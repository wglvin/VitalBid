// components/BidLeaderboard.js
import { useState, useEffect } from 'react';
import { getBidHistory } from '../services/bidService';

const BidLeaderboard = ({ listingId }) => {
  const [bids, setBids] = useState([]);
  
  useEffect(() => {
    const fetchBidHistory = async () => {
      const response = await getBidHistory(listingId);
      setBids(response.data);
    };
    
    fetchBidHistory();
  }, [listingId]);
  
  return (
    <div className="leaderboard">
      <h3>Current Bids</h3>
      <ul>
        {bids.map((bid, index) => (
          <li key={bid.id}>
            {index + 1}. User#{bid.user_id.substring(0, 5)} - ${bid.amount}
          </li>
        ))}
      </ul>
    </div>
  );
};