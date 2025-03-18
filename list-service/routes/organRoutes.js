const express = require('express');
const organController = require('../controllers/organController');

const router = express.Router();

// GET all organs
router.get('/', organController.getAllOrgans);

// GET organ by ID
router.get('/:id', organController.getOrganById);

// POST create a new organ
router.post('/', organController.createOrgan);

// PUT update an organ
router.put('/:id', organController.updateOrgan);

// DELETE an organ
router.delete('/:id', organController.deleteOrgan);

module.exports = router; 