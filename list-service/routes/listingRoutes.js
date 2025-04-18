const express = require('express');
const listingController = require('../controllers/listingController');

const router = express.Router();

// Image upload routes
router.post('/upload', listingController.uploadImage, listingController.handleImageUpload);
router.get('/images/:filename', listingController.getImage);
router.delete('/images/:filename', listingController.deleteImage);

// GET all listings
router.get('/', listingController.getAllListings);

// GET listing by ID
router.get('/:id', listingController.getListingById);

// POST create a new listing
router.post('/', listingController.createListing);

// PUT update a listing
router.put('/:id', listingController.updateListing);

module.exports = router; 