const { v4: uuidv4 } = require('uuid');
const { executeQuery } = require('../config/database');

// Bid model - direct SQL implementation
const Bid = {
  // Find all bids
  findAll: async (options = {}) => {
    let sql = 'SELECT * FROM bids';
    const params = [];
    
    // Handle where condition if present
    if (options.where) {
      const whereClauses = [];
      
      // Add listingId filter if present
      if (options.where.listingId) {
        whereClauses.push('listingId = ?');
        params.push(options.where.listingId);
      }
      
      if (whereClauses.length) {
        sql += ' WHERE ' + whereClauses.join(' AND ');
      }
    }
    
    // Handle order if present
    if (options.order && options.order.length) {
      const [field, direction] = options.order[0];
      sql += ` ORDER BY ${field} ${direction}`;
    } else {
      // Default order by createdAt DESC
      sql += ' ORDER BY createdAt DESC';
    }
    
    // Handle limit if present
    if (options.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
    }
    
    return executeQuery(sql, params);
  },
  
  // Find bid by primary key (id)
  findByPk: async (id) => {
    const sql = 'SELECT * FROM bids WHERE id = ?';
    const results = await executeQuery(sql, [id]);
    return results.length ? results[0] : null;
  },
  
  // Create a new bid
  create: async (data) => {
    const id = data.id || uuidv4();
    const sql = `
      INSERT INTO bids 
      (id, listingId, bidderId, amount, status, createdAt, updatedAt) 
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `;
    
    await executeQuery(sql, [
      id, 
      data.listingId, 
      data.bidderId, 
      data.amount, 
      data.status || 'pending'
    ]);
    
    // Return the created bid
    return { ...data, id };
  },
  
  // Update a bid
  update: async (data, condition) => {
    let updateFields = [];
    let params = [];
    
    // Build the SET part of the query dynamically based on the data
    if (data.status !== undefined) {
      updateFields.push('status = ?');
      params.push(data.status);
    }
    
    if (data.amount !== undefined) {
      updateFields.push('amount = ?');
      params.push(data.amount);
    }
    
    // Add updatedAt timestamp
    updateFields.push('updatedAt = NOW()');
    
    // Add the ID to the params array
    const { id } = condition.where;
    params.push(id);
    
    const sql = `UPDATE bids SET ${updateFields.join(', ')} WHERE id = ?`;
    await executeQuery(sql, params);
    
    // Return the updated bid
    return [1]; // [affectedRows]
  },
  
  // Find the highest bid for a listing
  findHighestBid: async (listingId) => {
    const sql = 'SELECT * FROM bids WHERE listingId = ? ORDER BY amount DESC LIMIT 1';
    const results = await executeQuery(sql, [listingId]);
    return results.length ? results[0] : null;
  }
};

// Function to initialize database (no schema creation needed as we're using pre-existing tables)
const initialize = async () => {
  try {
    // Just verify that we can connect to the tables
    await executeQuery('SELECT 1 FROM bids LIMIT 1');
    console.log('Bidding database connection verified successfully');
  } catch (error) {
    console.error('Error verifying database tables:', error);
    throw error;
  }
};

module.exports = {
  Bid,
  initialize
}; 