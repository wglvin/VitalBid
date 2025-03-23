const express = require('express');
const resolutionController = require('../controllers/resolutionController');

const router = express.Router();

// GET all resolutions
router.get('/', resolutionController.getAllResolutions);

// GET resolution by ID
router.get('/:id', resolutionController.getResolutionById);

// GET resolution by listing ID
router.get('/listing/:listingId', resolutionController.getResolutionByListingId);

// POST manually resolve a listing
router.post('/listing/:listingId/resolve', resolutionController.resolveListingManually);

// POST trigger resolution for all expired listings
router.post('/resolve-expired', resolutionController.resolveExpiredListings);

module.exports = router; 