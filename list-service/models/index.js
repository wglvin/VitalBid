const { executeQuery } = require('../config/database');

// Organ model - direct SQL implementation
const Organ = {
  // Find all organs
  findAll: async () => {
    const sql = 'SELECT * FROM organs';
    return executeQuery(sql);
  },
  
  // Find organ by primary key (id)
  findByPk: async (id) => {
    const sql = 'SELECT * FROM organs WHERE id = ?';
    const results = await executeQuery(sql, [id]);
    return results.length ? results[0] : null;
  },
  
  // Find organ by specific condition
  findOne: async (condition) => {
    let sql = 'SELECT * FROM organs WHERE ';
    const params = [];
    
    // Handle the 'where' condition for type
    if (condition.where && condition.where.type) {
      sql += 'type = ?';
      params.push(condition.where.type);
    } else {
      throw new Error('Invalid condition for findOne');
    }
    
    const results = await executeQuery(sql, params);
    return results.length ? results[0] : null;
  },
  
  // Create a new organ
  create: async (data) => {
    const sql = 'INSERT INTO organs (type, description) VALUES (?, ?)';
    const result = await executeQuery(sql, [data.type, data.description]);
    
    // Get the newly created organ with auto-incremented ID
    const newOrgan = await Organ.findByPk(result.insertId);
    return newOrgan;
  },
  
  // Update an organ
  update: async (data, condition) => {
    const { type, description } = data;
    const { id } = condition.where;
    
    const sql = 'UPDATE organs SET type = ?, description = ? WHERE id = ?';
    await executeQuery(sql, [type, description, id]);
    
    // Return the updated organ count
    return [1]; // [affectedRows]
  },
  
  // Delete an organ
  destroy: async (condition) => {
    const { id } = condition.where;
    
    const sql = 'DELETE FROM organs WHERE id = ?';
    const result = await executeQuery(sql, [id]);
    
    // Return the number of deleted rows
    return result.affectedRows;
  }
};

// Listing model - direct SQL implementation
const Listing = {
  // Find all listings
  findAll: async (options = {}) => {
    let sql = 'SELECT l.*, o.type as organType, o.description as organDescription FROM listings l JOIN organs o ON l.organId = o.id';
    const params = [];
    
    // Handle where condition if present
    if (options.where) {
      const whereClauses = [];
      
      // Add status filter if present
      if (options.where.status) {
        whereClauses.push('l.status = ?');
        params.push(options.where.status);
      }
      
      // Add expiry date filter if present
      if (options.where.expiryDate && options.where.expiryDate['[Op.lt]']) {
        whereClauses.push('l.expiryDate < ?');
        params.push(options.where.expiryDate['[Op.lt]']);
      }
      
      if (whereClauses.length) {
        sql += ' WHERE ' + whereClauses.join(' AND ');
      }
    }
    
    return executeQuery(sql, params);
  },
  
  // Find listing by primary key (id)
  findByPk: async (id) => {
    const sql = 'SELECT l.*, o.type as organType, o.description as organDescription FROM listings l JOIN organs o ON l.organId = o.id WHERE l.id = ?';
    const results = await executeQuery(sql, [id]);
    return results.length ? results[0] : null;
  },
  
  // Create a new listing
  create: async (data) => {
    const sql = `
      INSERT INTO listings 
      (title, description, startingPrice, status, expiryDate, organId, createdAt, updatedAt) 
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    
    const result = await executeQuery(sql, [
      data.title, 
      data.description, 
      data.startingPrice, 
      data.status || 'active', 
      data.expiryDate, 
      data.organId
    ]);
    
    // Get the newly created listing with auto-incremented ID
    const newListing = await Listing.findByPk(result.insertId);
    return newListing;
  },
  
  // Update a listing
  update: async (data, condition) => {
    let updateFields = [];
    let params = [];
    
    // Build the SET part of the query dynamically based on the data
    if (data.status !== undefined) {
      updateFields.push('status = ?');
      params.push(data.status);
    }
    
    if (data.title !== undefined) {
      updateFields.push('title = ?');
      params.push(data.title);
    }
    
    if (data.description !== undefined) {
      updateFields.push('description = ?');
      params.push(data.description);
    }
    
    if (data.startingPrice !== undefined) {
      updateFields.push('startingPrice = ?');
      params.push(data.startingPrice);
    }
    
    if (data.expiryDate !== undefined) {
      updateFields.push('expiryDate = ?');
      params.push(data.expiryDate);
    }
    
    // Add updatedAt timestamp
    updateFields.push('updatedAt = NOW()');
    
    // Add the ID to the params array
    const { id } = condition.where;
    params.push(id);
    
    const sql = `UPDATE listings SET ${updateFields.join(', ')} WHERE id = ?`;
    await executeQuery(sql, params);
    
    // Return the updated listing
    return [1]; // [affectedRows]
  }
};

// Function to initialize database (no schema creation needed as we're using pre-existing tables)
const initialize = async () => {
  try {
    // Just verify that we can connect to the tables
    await executeQuery('SELECT 1 FROM organs LIMIT 1');
    await executeQuery('SELECT 1 FROM listings LIMIT 1');
    console.log('Listing database connection verified successfully');
  } catch (error) {
    console.error('Error verifying database tables:', error);
    throw error;
  }
};

module.exports = {
  Organ,
  Listing,
  initialize
}; 