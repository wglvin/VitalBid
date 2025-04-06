const { Resolution } = require('../models');
const axios = require('axios');
const resolutionService = require('../services/resolutionService');
const { produceMessage } = require('../services/kafkaService');
const config = require('../config');

// Get all resolutions
exports.getAllResolutions = async (req, res) => {
  try {
    const resolutions = await Resolution.findAll();
    return res.status(200).json(resolutions);
  } catch (error) {
    console.error('Error fetching resolutions:', error);
    return res.status(500).json({ message: 'Failed to fetch resolutions', error: error.message });
  }
};

// Get resolution by ID
exports.getResolutionById = async (req, res) => {
  try {
    const resolution = await Resolution.findByPk(req.params.id);
    
    if (!resolution) {
      return res.status(404).json({ message: 'Resolution not found' });
    }
    
    return res.status(200).json(resolution);
  } catch (error) {
    console.error('Error fetching resolution:', error);
    return res.status(500).json({ message: 'Failed to fetch resolution', error: error.message });
  }
};

// Get resolution by listing ID
exports.getResolutionByListingId = async (req, res) => {
  try {
    const resolution = await Resolution.findByListingId(req.params.listingId);
    
    if (!resolution) {
      return res.status(404).json({ message: 'Resolution not found for this listing' });
    }
    
    return res.status(200).json(resolution);
  } catch (error) {
    console.error('Error fetching resolution by listing ID:', error);
    return res.status(500).json({ message: 'Failed to fetch resolution', error: error.message });
  }
};

// Resolve a listing manually
// exports.resolveListingManually = async (req, res) => {
//   try {
//     const { listingId } = req.params;
    
//     // Check if the listing is already resolved
//     const existingResolution = await Resolution.findByListingId(listingId);
//     if (existingResolution) {
//       return res.status(400).json({ message: 'Listing is already resolved' });
//     }
    
//     // Get the listing details from the listing service
//     const listingServiceUrl = process.env.LISTING_SERVICE_URL;
//     const listingResponse = await axios.get(`${listingServiceUrl}/api/listings/${listingId}`);
    
//     if (!listingResponse.data) {
//       return res.status(404).json({ message: 'Listing not found' });
//     }
    
//     const listing = listingResponse.data;
    
//     // Get the highest bid from the bidding service
//     const biddingServiceUrl = process.env.BIDDING_SERVICE_URL;
//     const bidsResponse = await axios.get(`${biddingServiceUrl}/api/bids/highest/${listingId}`);
    
//     // Create resolution record
//     const resolutionData = {};
    
//     if (bidsResponse.data && bidsResponse.data.highestBid) {
//       const highestBid = bidsResponse.data.highestBid;
      
//       // Update the bid status to accepted
//       await axios.post(`${biddingServiceUrl}/api/bids/${highestBid.id}/accept`);
      
//       // Create resolution with winning bid
//       resolutionData.listing_id = parseInt(listingId);
//       resolutionData.status = 'accepted';
//       resolutionData.winning_bid = parseFloat(highestBid.amount);
//       resolutionData.winner_id = highestBid.bidderId;
      
//       // Update the listing status to completed
//       await axios.put(`${listingServiceUrl}/api/listings/${listingId}`, {
//         status: 'completed'
//       });
//     } else {
//       // No bids, create resolution with cancelled status
//       resolutionData.listing_id = parseInt(listingId);
//       resolutionData.status = 'cancelled';
//       resolutionData.winning_bid = 0;
//       resolutionData.winner_id = 0;
      
//       // Update the listing status to cancelled
//       await axios.put(`${listingServiceUrl}/api/listings/${listingId}`, {
//         status: 'cancelled'
//       });
//     }
    
//     // Save resolution
//     const resolution = await Resolution.create(resolutionData);
    
//     return res.status(201).json({
//       message: 'Listing resolved successfully',
//       resolution
//     });
//   } catch (error) {
//     console.error('Error resolving listing:', error);
//     return res.status(500).json({ message: 'Failed to resolve listing', error: error.message });
//   }
// };

// Trigger resolution for all expired listings
// exports.resolveExpiredListings = async (req, res) => {
//   try {
//     // Call service method to resolve all expired listings
//     const results = await resolutionService.resolveExpiredListings();
//     return res.status(200).json(results);
//   } catch (error) {
//     console.error('Error resolving expired listings:', error);
//     return res.status(500).json({ message: 'Failed to resolve expired listings', error: error.message });
//   }
// };

// Accept a bid and create resolution
exports.acceptBid = async (req, res) => {
  try {
    const { bidId, listingId } = req.body;
    
    if (!bidId || !listingId) {
      return res.status(400).json({ message: 'Missing required fields: bidId and listingId' });
    }

    // Check if listing is already resolved
    const existingResolution = await Resolution.findByListingId(listingId);
    if (existingResolution) {
      return res.status(400).json({ message: `Listing ${listingId} is already resolved` });
    }

    // Get bid details from bid service
    const biddingServiceUrl = process.env.BIDDING_SERVICE_URL;
    const bidResponse = await axios.get(`${biddingServiceUrl}/api/bids/${bidId}`);
    const bid = bidResponse.data;

    if (!bid) {
      return res.status(404).json({ message: 'Bid not found' });
    }

    // Create resolution record
    const resolutionData = {
      listing_id: listingId,
      status: 'early',
      winning_bid: parseFloat(bid.amount),
      winner_id: bid.bidderId
    };

    // Save resolution record
    const resolution = await Resolution.create(resolutionData);
    
    // Get information from request headers
    const email = req.headers['x-user-email'];
    const username = req.headers['x-user-name'];
    
    // Send notification via Kafka
    try {
      await produceMessage(config.kafka.topics.bids, {  
        type: 'BID_ACCEPTED',
        data: {  // Wrap event data in a 'data' property to match the listing event structure
          bidderId: bid.bidderId,
          bidId: bidId,
          listingId: listingId,
          bidAmount: bid.amount,
          email: email,
          username: username,
          timestamp: new Date().toISOString()
        }
      });
      console.log('Bid acceptance notification sent to Kafka');
    } catch (kafkaError) {
      console.error('Failed to send bid acceptance notification to Kafka:', kafkaError.message);
      // Continue - don't fail the operation just because notification failed
    }

    return res.status(200).json({
      message: 'Bid accepted and resolution created successfully',
      resolution: resolution
    });
  } catch (error) {
    console.error('Error accepting bid:', error);
    return res.status(500).json({ 
      message: 'Failed to accept bid and create resolution', 
      error: error.message 
    });
  }
};