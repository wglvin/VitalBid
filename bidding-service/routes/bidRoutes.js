const express = require('express');
const bidController = require('../controllers/bidController');

const router = express.Router();

// GET all bids
router.get('/', bidController.getAllBids);

// GET bid by ID
router.get('/:id', bidController.getBidById);

// GET bids by listing
router.get('/listing/:listingId', bidController.getBidsByListing);

// GET highest bid for a listing
router.get('/highest/:listingId', bidController.getHighestBidForListing);

// POST create a new bid
router.post('/', bidController.createBid);

// PUT accept a bid
router.post('/:id/accept', bidController.acceptBid);

// PUT cancel a bid
router.put('/:id/cancel', bidController.cancelBid);

module.exports = router; 