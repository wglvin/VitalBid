const { Listing, Organ } = require('../models');
const { produceMessage } = require('../kafka/kafkaProducer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads');
        // Create uploads directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        // Accept images only
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

// Upload image
exports.uploadImage = upload.single('image');

// Handle image upload
exports.handleImageUpload = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Return the filename that was saved
        return res.status(200).json({
            message: 'Image uploaded successfully',
            filename: req.file.filename
        });
    } catch (error) {
        console.error('Error uploading image:', error);
        return res.status(500).json({ message: 'Failed to upload image', error: error.message });
    }
};

// Get image by filename
exports.getImage = async (req, res) => {
    try {
        const filename = req.params.filename;
        const filepath = path.join(__dirname, '../uploads', filename);

        // Check if file exists
        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ message: 'Image not found' });
        }

        // Send the file
        res.sendFile(filepath);
    } catch (error) {
        console.error('Error retrieving image:', error);
        return res.status(500).json({ message: 'Failed to retrieve image', error: error.message });
    }
};

// Delete image
exports.deleteImage = async (req, res) => {
    try {
        const filename = req.params.filename;
        const filepath = path.join(__dirname, '../uploads', filename);

        // Check if file exists
        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ message: 'Image not found' });
        }

        // Delete the file
        fs.unlinkSync(filepath);
        return res.status(200).json({ message: 'Image deleted successfully' });
    } catch (error) {
        console.error('Error deleting image:', error);
        return res.status(500).json({ message: 'Failed to delete image', error: error.message });
    }
};

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
    const { 
      title, description, organId, startingPrice, expiryDate, 
      ownerId, email, username, image
    } = req.body;
    
    console.log("Received listing creation request with data:", {
      title,
      description,
      organId,
      startingPrice,
      expiryDate,
      ownerId,
      email,
      username,
      image
    });
    
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
    
    // Log the image filename that will be used
    console.log("Using image filename:", image || 'default-organ.jpg');
    
    // Create new listing with image filename
    const listing = await Listing.create({
      title,
      description,
      startingPrice,
      expiryDate: expiry,
      organId,
      image: image || 'default-organ.jpg', // Use provided image or default
      ownerId
    });
    
    console.log("Created listing with ID:", listing.id, "and image:", listing.image);
    
    // Get email and username using exact field names that match the userData JSON
    const finalEmail = email || req.headers['x-user-email'] || `owner${ownerId}@example.com`;
    const finalUsername = username || req.headers['x-user-name'] || `User ${ownerId}`;
    
    // Return the response immediately
    res.status(201).json(listing);
    
    // Publish Kafka event asynchronously - don't await it
    produceMessage('ListingCreated', {
      id: listing.id,
      title: listing.title,
      description: listing.description,
      userId: ownerId,
      email: finalEmail,
      username: finalUsername,
      price: parseFloat(listing.startingPrice),
      image: listing.image,
      organId: listing.organId,
      expiryDate: listing.expiryDate,
      createdAt: listing.createdAt
    }).catch(error => {
      console.error('Failed to send Kafka notification:', error.message);
      // Error is logged but doesn't affect the API response
    });
    
  } catch (error) {
    console.error('Error creating listing:', error);
    return res.status(500).json({ message: 'Failed to create listing', error: error.message });
  }
};

// Update listing
exports.updateListing = async (req, res) => {
  try {
    const { title, description, startingPrice, expiryDate, image } = req.body;
    const listingId = req.params.id;
    
    // Find the listing
    const listing = await Listing.findByPk(listingId);
    
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    
    // Validate starting price if provided
    if (startingPrice !== undefined && parseFloat(startingPrice) <= 0) {
      return res.status(400).json({ message: 'Starting price must be greater than zero' });
    }
    
    // Validate expiry date if provided
    let expiry = null;
    if (expiryDate) {
      expiry = new Date(expiryDate);
      if (expiry <= new Date()) {
        return res.status(400).json({ message: 'Expiry date must be in the future' });
      }
    }
    
    // Update listing
    await Listing.update({
      title: title || listing.title,
      description: description !== undefined ? description : listing.description,
      startingPrice: startingPrice !== undefined ? startingPrice : listing.startingPrice,
      expiryDate: expiryDate ? expiry : listing.expiryDate,
      image: image || listing.image
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