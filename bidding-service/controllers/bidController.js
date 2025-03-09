const { Bid } = require('../models');
const { Op } = require('sequelize');
const axios = require('axios');

// Create a new bid
exports.createBid = async (req, res) => {
  try {
    const { listingId, bidderId, amount } = req.body;
    
    // Validate required fields
    if (!listingId || !bidderId || amount === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Validate bid amount is positive
    if (amount <= 0) {
      return res.status(400).json({ message: 'Bid amount must be greater than zero' });
    }
    
    // Get listing details from listing service
    const listingServiceUrl = process.env.LISTING_SERVICE_URL || 'http://listing-service:3001';
    const listingResponse = await axios.get(`${listingServiceUrl}/api/listings/${listingId}`);
    const listing = listingResponse.data;
    
    // Check if listing exists and is active
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    
    if (listing.status !== 'active') {
      return res.status(400).json({ 
        message: `Cannot bid on a listing with status: ${listing.status}`,
        listing
      });
    }
    
    // Check if listing has expired
    const expiryDate = new Date(listing.expiryDate);
    if (expiryDate < new Date()) {
      return res.status(400).json({ 
        message: 'Cannot bid on an expired listing',
        expiryDate
      });
    }
    
    // Check if bid amount is greater than starting price
    if (parseFloat(amount) < parseFloat(listing.startingPrice)) {
      return res.status(400).json({ 
        message: `Bid amount must be at least the starting price of ${listing.startingPrice}`,
        startingPrice: listing.startingPrice
      });
    }
    
    // Get highest bid for this listing
    const highestBid = await Bid.findOne({
      where: { 
        listingId,
        status: 'active'
      },
      order: [['amount', 'DESC']]
    });
    
    // Check if new bid is higher than current highest bid
    if (highestBid && parseFloat(amount) <= parseFloat(highestBid.amount)) {
      return res.status(400).json({ 
        message: `Bid amount must be greater than the current highest bid of ${highestBid.amount}`,
        currentHighestBid: highestBid.amount
      });
    }
    
    // Check if bidder is bidding on their own listing
    if (bidderId === listing.donorId) {
      return res.status(400).json({ message: 'Cannot bid on your own listing' });
    }
    
    // Create new bid
    const bid = await Bid.create({
      listingId,
      bidderId,
      amount,
      status: 'active',
      bidTime: new Date()
    });
    
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
    const highestBid = await Bid.findOne({
      where: { 
        listingId,
        status: 'active'
      },
      order: [['amount', 'DESC']]
    });
    
    if (!highestBid) {
      return res.status(200).json({ message: 'No bids found for this listing', highestBid: null });
    }
    
    return res.status(200).json({ highestBid });
  } catch (error) {
    console.error('Error fetching highest bid:', error);
    return res.status(500).json({ message: 'Failed to fetch highest bid', error: error.message });
  }
};

// Accept a bid (mark as accepted)
exports.acceptBid = async (req, res) => {
  try {
    const bidId = req.params.id;
    const bid = await Bid.findByPk(bidId);
    
    if (!bid) {
      return res.status(404).json({ message: 'Bid not found' });
    }
    
    if (bid.status !== 'active') {
      return res.status(400).json({ message: `Cannot accept bid with status: ${bid.status}` });
    }
    
    // Update this bid to accepted
    await bid.update({ status: 'accepted' });
    
    // Update all other bids for this listing to rejected
    await Bid.update(
      { status: 'rejected' },
      {
        where: {
          listingId: bid.listingId,
          id: { [Op.ne]: bidId },
          status: 'active'
        }
      }
    );
    
    return res.status(200).json({ 
      message: 'Bid accepted successfully', 
      bid 
    });
  } catch (error) {
    console.error('Error accepting bid:', error);
    return res.status(500).json({ message: 'Failed to accept bid', error: error.message });
  }
};

// Cancel a bid
exports.cancelBid = async (req, res) => {
  try {
    const bidId = req.params.id;
    const { bidderId } = req.body;
    
    const bid = await Bid.findByPk(bidId);
    
    if (!bid) {
      return res.status(404).json({ message: 'Bid not found' });
    }
    
    // Ensure the bidder owns the bid
    if (bidderId && bid.bidderId !== bidderId) {
      return res.status(403).json({ message: 'Not authorized to cancel this bid' });
    }
    
    if (bid.status !== 'active') {
      return res.status(400).json({ message: `Cannot cancel bid with status: ${bid.status}` });
    }
    
    // Update bid status to cancelled
    await bid.update({ status: 'cancelled' });
    
    return res.status(200).json({ 
      message: 'Bid cancelled successfully', 
      bid 
    });
  } catch (error) {
    console.error('Error cancelling bid:', error);
    return res.status(500).json({ message: 'Failed to cancel bid', error: error.message });
  }
}; 