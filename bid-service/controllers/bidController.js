const { Bid } = require('../models');
const axios = require('axios');
const { executeQuery } = require('../config/database');


// Create a new bid
exports.createBid = async (req, res) => {
  try {
    const { listingId, bidderId, amount } = req.body;
    
    // Validate required fields
    if (!listingId || !bidderId || amount === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Validate bid amount is positive
    if (parseFloat(amount) <= 0) {
      return res.status(400).json({ message: 'Bid amount must be greater than zero' });
    }
    
    // Fetch listing details to check expiry date
    try {
      // Get the URL from environment variable
      const listingServiceUrl = process.env.LISTING_SERVICE_URL;
      console.log('Using listing service URL:', listingServiceUrl); // Debug log

      if (!listingServiceUrl) {
        throw new Error('LISTING_SERVICE_URL environment variable is not set');
      }

      const response = await axios.get(`${listingServiceUrl}/api/listings/${listingId}`);
      const listing = response.data;
      
      // Check if listing exists
      if (!listing) {
        return res.status(404).json({ message: 'Listing not found' });
      }
      
      // Check if listing is expired
      const currentTime = new Date();
      console.log(listing);
      const expiryTime = new Date(listing.expiryDate || listing.time_end);
      
      if (currentTime > expiryTime) {
        return res.status(400).json({ 
          message: 'Cannot place bid on expired listing',
          expiryTime: expiryTime.toISOString(),
          currentTime: currentTime.toISOString()
        });
      }
      
      // Continue with bid placement if listing is not expired
    } catch (error) {
      console.error('Error fetching listing details:', error);
      
      // If we can't access the listing service, proceed with bid placement
      // This is a fallback to prevent complete failure if the listing service is down
      console.warn('Could not verify listing expiry date. Proceeding with bid placement.');
    }
    
    // Check if the bid amount is higher than the current highest bid
    try {
      // Get the highest bid for this listing
      const highestBidQuery = `
        SELECT amount FROM bids 
        WHERE listingId = ? 
        ORDER BY amount DESC 
        LIMIT 1
      `;
      const highestBids = await executeQuery(highestBidQuery, [listingId]);
      const highestBid = highestBids[0]?.amount || 0;
      
      if (parseFloat(amount) <= parseFloat(highestBid)) {
        return res.status(400).json({ 
          message: 'Bid amount must be higher than the current highest bid',
          currentHighestBid: parseFloat(highestBid)
        });
      }
    } catch (error) {
      console.error('Error checking highest bid:', error);
      // Continue with bid placement if we can't check the highest bid
    }
    
    // Convert types to match database schema
    const bidData = {
      listingId: parseInt(listingId),
      bidderId: parseInt(bidderId), 
      amount: parseFloat(amount),
      bidTime: new Date()
    };

    // Create new bid
    const bid = await Bid.create(bidData);
    
    return res.status(201).json(bid);
  } catch (error) {
    console.error('Error creating bid:', error);
    return res.status(500).json({ message: 'Failed to create bid', error: error.message });
  }
};

// Get all bids
exports.getAllBids = async (req, res) => {
  try {
    const bids = await Bid.findAll({
      order: [['bidTime', 'DESC']]
    });
    return res.status(200).json(bids);
  } catch (error) {
    console.error('Error fetching bids:', error);
    return res.status(500).json({ message: 'Failed to fetch bids', error: error.message });
  }
};

// Get bid by ID
exports.getBidById = async (req, res) => {
  try {
    const bid = await Bid.findByPk(req.params.id);
    
    if (!bid) {
      return res.status(404).json({ message: 'Bid not found' });
    }
    
    return res.status(200).json(bid);
  } catch (error) {
    console.error('Error fetching bid:', error);
    return res.status(500).json({ message: 'Failed to fetch bid', error: error.message });
  }
};

// Get bids for a specific listing
exports.getBidsByListing = async (req, res) => {
  try {
    const listingId = req.params.listingId;
    const bids = await Bid.findAll({
      where: { listingId },
      order: [['amount', 'DESC']]
    });
    
    return res.status(200).json(bids);
  } catch (error) {
    console.error('Error fetching bids for listing:', error);
    return res.status(500).json({ message: 'Failed to fetch bids for listing', error: error.message });
  }
};

// Get highest bid for a listing
exports.getHighestBidForListing = async (req, res) => {
  try {
    const listingId = req.params.listingId;
    const highestBid = await Bid.findHighestBid(listingId);
    
    if (!highestBid) {
      return res.status(200).json({ message: 'No bids found for this listing', highestBid: null });
    }
    
    return res.status(200).json({ highestBid });
  } catch (error) {
    console.error('Error fetching highest bid:', error);
    return res.status(500).json({ message: 'Failed to fetch highest bid', error: error.message });
  }
};
// Get bid history for a listing
exports.getBidHistory = async (req, res) => {
  try {
    const listingId = req.params.listingId;
    const bids = await Bid.findAll({
      where: { listingId },
      order: [['amount', 'DESC']]
    });

    // Transform to frontend format without adding status
    const frontendBids = bids.map(bid => ({
      bid_id: bid.id,
      listing_id: bid.listingId,
      bidder_id: bid.bidderId,
      bid_amt: parseFloat(bid.amount),
      bid_time: bid.bidTime
    }));

    return res.status(200).json(frontendBids);
  } catch (error) {
    console.error('Error fetching bid history:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch bid history', 
      error: error.message 
    });
  }
};