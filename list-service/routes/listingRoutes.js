const express = require('express');
const listingController = require('../controllers/listingController');

const router = express.Router();

// GET all listings
router.get('/', listingController.getAllListings);

// GET listing by ID
router.get('/:id', listingController.getListingById);

// POST create a new listing
router.post('/', listingController.createListing);

// PUT update a listing
router.put('/:id', listingController.updateListing);

// DELETE a listing
router.delete('/:id', listingController.deleteListing);

module.exports = router; 