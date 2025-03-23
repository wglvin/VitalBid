const { Resolution } = require('../models');
const axios = require('axios');

class ResolutionService {
  // Method to resolve expired listings
  async resolveExpiredListings() {
    try {
      // Get all active listings from the listing service
      const listingServiceUrl = process.env.LISTING_SERVICE_URL || 'http://list-service:3001';
      const response = await axios.get(`${listingServiceUrl}/api/listings`);
      const allListings = response.data;
      
      // Filter expired listings
      const now = new Date();
      const expiredListings = allListings.filter(listing => 
        listing.status === 'active' && new Date(listing.expiryDate) < now
      );
      
      console.log(`Found ${expiredListings.length} expired listings to resolve`);
      
      const resolved = [];
      const errors = [];
      
      // Process each expired listing
      for (const listing of expiredListings) {
        try {
          // Check if listing is already resolved
          const existingResolution = await Resolution.findByListingId(listing.id);
          if (existingResolution) {
            console.log(`Listing ${listing.id} is already resolved, skipping`);
            continue;
          }
          
          // Get the highest bid from the bidding service
          const biddingServiceUrl = process.env.BIDDING_SERVICE_URL || 'http://bid-service:3002';
          const bidsResponse = await axios.get(`${biddingServiceUrl}/api/bids/highest/${listing.id}`);
          
          const resolutionData = {};
          
          if (bidsResponse.data && bidsResponse.data.highestBid) {
            // There is a winning bid
            const highestBid = bidsResponse.data.highestBid;
            
            // Accept the winning bid
            await axios.post(`${biddingServiceUrl}/api/bids/${highestBid.id}/accept`);
            
            // Create resolution record
            resolutionData.listing_id = listing.id;
            resolutionData.status = 'accepted';
            resolutionData.winning_bid = parseFloat(highestBid.amount);
            resolutionData.winner_id = highestBid.bidderId;
            
            // Update listing status to completed
            await axios.put(`${listingServiceUrl}/api/listings/${listing.id}`, {
              status: 'completed'
            });
            
            console.log(`Listing ${listing.id} resolved with winning bid ${highestBid.id}`);
          } else {
            // No bids found, mark as cancelled
            resolutionData.listing_id = listing.id;
            resolutionData.status = 'cancelled';
            resolutionData.winning_bid = 0;
            resolutionData.winner_id = 0;
            
            // Update listing status to cancelled
            await axios.put(`${listingServiceUrl}/api/listings/${listing.id}`, {
              status: 'cancelled'
            });
            
            console.log(`Listing ${listing.id} cancelled due to no bids`);
          }
          
          // Save resolution record
          const resolution = await Resolution.create(resolutionData);
          resolved.push(resolution);
          
        } catch (error) {
          console.error(`Error resolving listing ${listing.id}:`, error.message);
          errors.push({
            listingId: listing.id,
            error: error.message
          });
          // Continue processing other listings
        }
      }
      
      return { 
        success: true, 
        resolved: resolved.length,
        errors: errors.length,
        resolvedItems: resolved,
        errorItems: errors
      };
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
    
    console.log(`Resolution scheduler started with ${intervalMinutes} minute interval`);
    return this.resolutionInterval;
  }
  
  // Stop the resolution scheduler if needed
  stopResolutionScheduler() {
    if (this.resolutionInterval) {
      clearInterval(this.resolutionInterval);
      this.resolutionInterval = null;
      console.log('Resolution scheduler stopped');
      return true;
    }
    return false;
  }
}

module.exports = new ResolutionService(); 