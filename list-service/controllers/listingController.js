const { Listing, Organ } = require('../models');
const { produceMessage } = require('../kafka/kafkaProducer');

// Get all listings
exports.getAllListings = async (req, res) => {
  try {
    const listings = await Listing.findAll({
      include: [{
        model: Organ,
        attributes: ['id', 'type', 'description']
      }]
    });
    return res.status(200).json(listings);
  } catch (error) {
    console.error('Error fetching listings:', error);
    return res.status(500).json({ message: 'Failed to fetch listings', error: error.message });
  }
};

// Get listing by ID
exports.getListingById = async (req, res) => {
  try {
    const listing = await Listing.findByPk(req.params.id, {
      include: [{
        model: Organ,
        attributes: ['id', 'type', 'description']
      }]
    });
    
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    
    return res.status(200).json(listing);
  } catch (error) {
    console.error('Error fetching listing:', error);
    return res.status(500).json({ message: 'Failed to fetch listing', error: error.message });
  }
};

// Create new listing
exports.createListing = async (req, res) => {
  try {
    console.log("===== LISTING CREATION DEBUG =====");
    console.log("All request headers:", req.headers);
    console.log("All body fields:", Object.keys(req.body));
    console.log("email in body:", req.body.email);
    console.log("X-User-Email header:", req.headers['x-user-email']);
    console.log("================================");
    
    const { 
      title, description, organId, startingPrice, expiryDate, 
      status, ownerId, email, username // Changed field names to match JSON
    } = req.body;
    
    // More detailed console logs for debugging
    console.log("email from request body:", email);
    console.log("username from request body:", username);
    console.log("X-User-Email from headers:", req.headers['x-user-email']);
    console.log("X-User-Name from headers:", req.headers['x-user-name']);
    
    // Validate required fields
    if (!title || !startingPrice || !expiryDate || !organId || !ownerId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Validate organ exists
    const organ = await Organ.findByPk(organId);
    if (!organ) {
      return res.status(404).json({ message: 'Organ not found' });
    }
    
    // Validate starting price is positive
    if (parseFloat(startingPrice) <= 0) {
      return res.status(400).json({ message: 'Starting price must be greater than zero' });
    }
    
    // Validate expiry date is in the future
    const expiry = new Date(expiryDate);
    if (expiry <= new Date()) {
      return res.status(400).json({ message: 'Expiry date must be in the future' });
    }
    
    // Create new listing
    const listing = await Listing.create({
      title,
      description,
      startingPrice,
      expiryDate: expiry,
      organId,
      status,
      ownerId
    });
    
    // Get email and username using exact field names that match the userData JSON
    const finalEmail = email || req.headers['x-user-email'] || `owner${ownerId}@example.com`;
    const finalUsername = username || req.headers['x-user-name'] || `User ${ownerId}`;
    
    console.log("Final values for notification:", { finalEmail, finalUsername });
    
    // Publish Kafka event for listing creation with the proper user data
    await produceMessage('ListingCreated', {
      id: listing.id,
      title: listing.title,
      description: listing.description,
      userId: ownerId,
      email: finalEmail,
      username: finalUsername,
      price: parseFloat(listing.startingPrice),
      status: listing.status,
      organId: listing.organId,
      expiryDate: listing.expiryDate,
      createdAt: listing.createdAt
    });
    
    return res.status(201).json(listing);
  } catch (error) {
    console.error('Error creating listing:', error);
    return res.status(500).json({ message: 'Failed to create listing', error: error.message });
  }
};

// Update listing
exports.updateListing = async (req, res) => {
  try {
    const { title, description, startingPrice, expiryDate, status } = req.body;
    const listingId = req.params.id;
    
    // Find the listing
    const listing = await Listing.findByPk(listingId);
    
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    
    // Validate status change
    if (status && !['active', 'pending', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    // Validate starting price if provided
    if (startingPrice !== undefined && parseFloat(startingPrice) <= 0) {
      return res.status(400).json({ message: 'Starting price must be greater than zero' });
    }
    
    // Validate expiry date if provided
    let expiry = null;
    if (expiryDate) {
      expiry = new Date(expiryDate);
      if (expiry <= new Date() && listing.status === 'active') {
        return res.status(400).json({ message: 'Expiry date must be in the future for active listings' });
      }
    }
    
    // Update listing
    await Listing.update({
      title: title || listing.title,
      description: description !== undefined ? description : listing.description,
      startingPrice: startingPrice !== undefined ? startingPrice : listing.startingPrice,
      expiryDate: expiryDate ? expiry : listing.expiryDate,
      status: status || listing.status
    },{
      where: {
        id: listingId
      }
    });
    
    return res.status(200).json(listing);
  } catch (error) {
    console.error('Error updating listing:', error);
    return res.status(500).json({ message: 'Failed to update listing', error: error.message });
  }
};

// Delete listing
exports.deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findByPk(req.params.id);
    
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    
    // Only allow deletion if no bids have been placed
    // In a real application, you might check with the bidding service first
    
    await listing.destroy();
    return res.status(200).json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('Error deleting listing:', error);
    return res.status(500).json({ message: 'Failed to delete listing', error: error.message });
  }
};