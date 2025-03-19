const { Listing, Organ } = require('../models');
const axios = require('axios');

class ListingService {
  // Existing methods
  // ... existing code ...
  
  // New method to resolve expired listings
  async resolveExpiredListings() {
    try {
      // Find all active listings that have passed their expiry date
      const expiredListings = await Listing.findAll({
        where: {
          status: 'active',
          expiryDate: {
            '[Op.lt]': new Date()
          }
        }
      });
      
      console.log(`Found ${expiredListings.length} expired listings to resolve`);
      
      // Process each expired listing
      for (const listing of expiredListings) {
        try {
          // Get the highest bid from the bidding service
          const biddingServiceUrl = process.env.BIDDING_SERVICE_URL || 'http://bid-service:3002';
          const response = await axios.get(`${biddingServiceUrl}/api/bids/highest/${listing.id}`);
          
          if (response.data && response.data.highestBid) {
            // Update listing status to completed
            await Listing.update({ 
              status: 'completed'
            }, {
              where: { id: listing.id }
            });
            
            // Notify the bidding service about the winning bid
            await axios.post(`${biddingServiceUrl}/api/bids/${response.data.highestBid.id}/accept`);
            
            console.log(`Listing ${listing.id} resolved with winning bid ${response.data.highestBid.id}`);
          } else {
            // No bids found, mark as expired
            await Listing.update({ status: 'cancelled' }, {
              where: { id: listing.id }
            });
            console.log(`Listing ${listing.id} cancelled due to no bids`);
          }
        } catch (error) {
          console.error(`Error resolving listing ${listing.id}:`, error.message);
          // Continue processing other listings despite errors
        }
      }
      
      return { success: true, resolved: expiredListings.length };
    } catch (error) {
      console.error('Error resolving expired listings:', error);
      throw new Error('Failed to resolve expired listings');
    }
  }
  
  // Schedule periodic resolution of expired listings
  startResolutionScheduler(intervalMinutes = 5) {
    // Run immediately once
    this.resolveExpiredListings().catch(err => 
      console.error('Error in initial resolution run:', err)
    );
    
    // Then set up interval
    const intervalMs = intervalMinutes * 60 * 1000;
    
    // Store the interval ID so it can be cleared if needed
    this.resolutionInterval = setInterval(() => {
      this.resolveExpiredListings().catch(err => 
        console.error('Error in scheduled resolution run:', err)
      );
    }, intervalMs);
    
    console.log(`Listing resolution scheduler started with ${intervalMinutes} minute interval`);
    return this.resolutionInterval;
  }
  
  // Stop the resolution scheduler if needed
  stopResolutionScheduler() {
    if (this.resolutionInterval) {
      clearInterval(this.resolutionInterval);
      this.resolutionInterval = null;
      console.log('Listing resolution scheduler stopped');
      return true;
    }
    return false;
  }
}

module.exports = new ListingService(); 