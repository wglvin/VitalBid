// pages/Marketplace.js
import { useState, useEffect } from 'react';
import ItemListing from 'ItemListing.js';
import BidModal from 'BidModal.js';
import { placeBid } from 'services/bidService.js';

const Marketplace = () => {
  const [listings, setListings] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [showBidModal, setShowBidModal] = useState(false);
  
  useEffect(() => {
    const fetchListings = async () => {
      const data = await getListings();
      setListings(data);
    };
    
    fetchListings();
  }, []);
  
  const handleBidClick = (listing) => {
    setSelectedListing(listing);
    setShowBidModal(true);
  };
  
  const handleBidSubmit = async (listingId, amount) => {
    try {
      const response = await placeBid(listingId, amount);
      if (response.data.bid_status === 'success') {
        // Redirect to payment page with bid info
        window.location.href = `/payment?bidId=${response.data.bid_id}&amount=${amount}`;
      }
    } catch (error) {
      console.error('Error placing bid:', error);
    }
    setShowBidModal(false);
  };
  
  return (
    <div className="marketplace">
      <h1>Organ Marketplace</h1>
      <div className="listings-grid">
        {listings.map(listing => (
          <ItemListing 
            key={listing.id} 
            item={listing} 
            onBidClick={() => handleBidClick(listing)}
          />
        ))}
      </div>
      
      {showBidModal && (
        <BidModal 
          listingId={selectedListing?.id}
          onClose={() => setShowBidModal(false)}
          onBidSubmit={handleBidSubmit}
        />
      )}
    </div>
  );
};