const { Listing, Organ } = require('../models');

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
    const { title, description, startingPrice, expiryDate, organId } = req.body;
    
    // Validate required fields
    if (!title || !startingPrice || !expiryDate || !organId) {
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
      status: 'active'
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
    await listing.update({
      title: title || listing.title,
      description: description !== undefined ? description : listing.description,
      startingPrice: startingPrice !== undefined ? startingPrice : listing.startingPrice,
      expiryDate: expiryDate ? expiry : listing.expiryDate,
      status: status || listing.status
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