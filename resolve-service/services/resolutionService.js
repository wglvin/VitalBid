const { Resolution } = require('../models');
const axios = require('axios');

class ResolutionService {
  // Method to resolve expired listings
  async resolveExpiredListings() {
    try {
      // Get all active listings from the listing service
      const listingServiceUrl = process.env.LISTING_SERVICE_URL;
      
      try {
        const response = await axios.get(`${listingServiceUrl}/api/listings`);
        const allListings = response.data;
        
        // Filter expired listings
        const now = new Date();
        const expiredListings = allListings.filter(listing => 
          new Date(listing.expiryDate) < now
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
              continue;
            }
            
            // Get the highest bid from the bidding service and resolve them as winner
            const biddingServiceUrl = process.env.BIDDING_SERVICE_URL;
            
            try {
              const bidsResponse = await axios.get(`${biddingServiceUrl}/api/bids/highest/${listing.id}`);
              
              if (bidsResponse.data && bidsResponse.data.highestBid) {
                // There is a winning bid
                const highestBid = bidsResponse.data.highestBid;
                
                try {
                  // Instead of calling bid service directly, use our own acceptBid logic
                  const resolutionData = {
                    listing_id: listing.id,
                    status: 'accepted',
                    winning_bid: parseFloat(highestBid.amount),
                    winner_id: highestBid.bidderId
                  };

                  // Save resolution record
                  const resolution = await Resolution.create(resolutionData);
                  
                  console.log(`Listing ${listing.id} resolved with winning bid id ${highestBid.id}`);
                  resolved.push(resolution);

                } catch (acceptError) {
                  console.error(`Error accepting bid for listing ${listing.id}:`, acceptError.response?.data || acceptError.message);
                  throw acceptError;
                }
              } else {
                // No bids found, mark as cancelled
                const resolutionData = {
                  listing_id: listing.id,
                  status: 'cancelled',
                  winning_bid: 0,
                  winner_id: 0
                };
                
                // Save resolution record
                const resolution = await Resolution.create(resolutionData);
                console.log(`Listing ${listing.id} had no bids`);
                resolved.push(resolution);
              }
              
            } catch (bidsError) {
              console.error(`Error fetching bids for listing ${listing.id}:`, {
                error: bidsError.message,
                response: bidsError.response?.data,
                url: `${biddingServiceUrl}/api/bids/highest/${listing.id}`
              });
              throw bidsError;
            }
            
          } catch (error) {
            console.error(`Error resolving listing ${listing.id}:`, {
              message: error.message,
              response: error.response?.data,
              stack: error.stack
            });
            errors.push({
              listingId: listing.id,
              error: error.message,
              details: error.response?.data
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
        if (error.code === 'ENOTFOUND') {
          console.error(`Could not resolve hostname: ${error.hostname}. Please check your Docker network configuration and service names.`);
        }
        if (error.code === 'ECONNREFUSED') {
          console.error(`Connection refused at ${listingServiceUrl}. Please check if the service is running.`);
        }
        throw error;
      }
    } catch (error) {
      console.error('Error resolving expired listings:', {
        error: error.message,
        code: error.code,
        hostname: error.hostname,
        serviceUrl: process.env.LISTING_SERVICE_URL
      });
      throw new Error('Failed to resolve expired listings');
    }
  }
  
  // Schedule periodic resolution of expired listings
  startResolutionScheduler(intervalSeconds = 1) {
    // Run immediately once
    this.resolveExpiredListings().catch(err => 
      console.error('Error in initial resolution run:', err)
    );
    
    // Then set up interval (convert seconds to milliseconds)
    const intervalMs = intervalSeconds * 1000;  // Changed from minutes to seconds
    
    // Store the interval ID so it can be cleared if needed
    this.resolutionInterval = setInterval(() => {
      console.log(`Running scheduled resolution check at ${new Date().toISOString()}`);
      this.resolveExpiredListings().catch(err => 
        console.error('Error in scheduled resolution run:', err)
      );
    }, intervalMs);
    
    console.log(`Resolution scheduler started with ${intervalSeconds} second interval`);
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