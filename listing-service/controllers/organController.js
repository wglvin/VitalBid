const { Organ } = require('../models');

// Get all organs
exports.getAllOrgans = async (req, res) => {
  try {
    const organs = await Organ.findAll();
    return res.status(200).json(organs);
  } catch (error) {
    console.error('Error fetching organs:', error);
    return res.status(500).json({ message: 'Failed to fetch organs', error: error.message });
  }
};

// Get organ by ID
exports.getOrganById = async (req, res) => {
  try {
    const organ = await Organ.findByPk(req.params.id);
    
    if (!organ) {
      return res.status(404).json({ message: 'Organ not found' });
    }
    
    return res.status(200).json(organ);
  } catch (error) {
    console.error('Error fetching organ:', error);
    return res.status(500).json({ message: 'Failed to fetch organ', error: error.message });
  }
};

// Create new organ
exports.createOrgan = async (req, res) => {
  try {
    const { type, description } = req.body;
    
    // Validate required fields
    if (!type) {
      return res.status(400).json({ message: 'Organ type is required' });
    }
    
    // Check if organ type already exists (case insensitive)
    const existingOrgan = await Organ.findOne({
      where: {
        type: type.trim()
      }
    });
    
    if (existingOrgan) {
      return res.status(409).json({ 
        message: 'Organ type already exists',
        existingOrgan
      });
    }
    
    // Create new organ
    const organ = await Organ.create({
      type: type.trim(),
      description
    });
    
    return res.status(201).json(organ);
  } catch (error) {
    console.error('Error creating organ:', error);
    
    // Handle Sequelize unique constraint violation error
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ 
        message: 'Organ type already exists',
        error: error.message
      });
    }
    
    return res.status(500).json({ message: 'Failed to create organ', error: error.message });
  }
};

// Update organ
exports.updateOrgan = async (req, res) => {
  try {
    const { type, description } = req.body;
    const organId = req.params.id;
    
    // Find the organ
    const organ = await Organ.findByPk(organId);
    
    if (!organ) {
      return res.status(404).json({ message: 'Organ not found' });
    }
    
    // If type is changing, check for duplicates
    if (type && type !== organ.type) {
      const existingOrgan = await Organ.findOne({
        where: {
          type: type.trim()
        }
      });
      
      if (existingOrgan && existingOrgan.id !== organId) {
        return res.status(409).json({ 
          message: 'Organ type already exists',
          existingOrgan
        });
      }
    }
    
    // Update organ
    await organ.update({
      type: type ? type.trim() : organ.type,
      description: description !== undefined ? description : organ.description
    });
    
    return res.status(200).json(organ);
  } catch (error) {
    console.error('Error updating organ:', error);
    
    // Handle Sequelize unique constraint violation error
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ 
        message: 'Organ type already exists',
        error: error.message
      });
    }
    
    return res.status(500).json({ message: 'Failed to update organ', error: error.message });
  }
};

// Delete organ
exports.deleteOrgan = async (req, res) => {
  try {
    const organ = await Organ.findByPk(req.params.id);
    
    if (!organ) {
      return res.status(404).json({ message: 'Organ not found' });
    }
    
    await organ.destroy();
    return res.status(200).json({ message: 'Organ deleted successfully' });
  } catch (error) {
    console.error('Error deleting organ:', error);
    return res.status(500).json({ message: 'Failed to delete organ', error: error.message });
  }
}; 