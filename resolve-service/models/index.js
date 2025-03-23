const { executeQuery } = require('../config/database');

// Resolution model - direct SQL implementation
const Resolution = {
  // Find all resolutions
  findAll: async (options = {}) => {
    let sql = 'SELECT * FROM resolving';
    const params = [];
    
    // Handle where condition if present
    if (options.where) {
      const whereClauses = [];
      
      // Add listing_id filter if present
      if (options.where.listing_id) {
        whereClauses.push('listing_id = ?');
        params.push(options.where.listing_id);
      }
      
      // Add status filter if present
      if (options.where.status) {
        whereClauses.push('status = ?');
        params.push(options.where.status);
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
      // Default order by resolvedAt DESC
      sql += ' ORDER BY resolvedAt DESC';
    }
    
    return executeQuery(sql, params);
  },
  
  // Find resolution by primary key (id)
  findByPk: async (id) => {
    const sql = 'SELECT * FROM resolving WHERE id = ?';
    const results = await executeQuery(sql, [id]);
    return results.length ? results[0] : null;
  },
  
  // Find resolution by listing ID
  findByListingId: async (listingId) => {
    const sql = 'SELECT * FROM resolving WHERE listing_id = ? ORDER BY resolvedAt DESC LIMIT 1';
    const results = await executeQuery(sql, [listingId]);
    return results.length ? results[0] : null;
  },
  
  // Create a new resolution record
  create: async (data) => {
    const sql = `
      INSERT INTO resolving 
      (listing_id, status, winning_bid, winner_id, resolvedAt) 
      VALUES (?, ?, ?, ?, NOW())
    `;
    
    const result = await executeQuery(sql, [
      data.listing_id, 
      data.status || 'active',
      data.winning_bid, 
      data.winner_id
    ]);
    
    // Get the newly created resolution with auto-incremented ID
    return { 
      id: result.insertId,
      ...data,
      resolvedAt: new Date()
    };
  },
  
  // Update a resolution
  update: async (data, condition) => {
    let updateFields = [];
    let params = [];
    
    // Build the SET part of the query dynamically based on the data
    if (data.status !== undefined) {
      updateFields.push('status = ?');
      params.push(data.status);
    }
    
    if (data.winning_bid !== undefined) {
      updateFields.push('winning_bid = ?');
      params.push(data.winning_bid);
    }
    
    if (data.winner_id !== undefined) {
      updateFields.push('winner_id = ?');
      params.push(data.winner_id);
    }
    
    // Add the ID to the params array
    const { id } = condition.where;
    params.push(id);
    
    const sql = `UPDATE resolving SET ${updateFields.join(', ')} WHERE id = ?`;
    await executeQuery(sql, params);
    
    // Return the updated resolution count
    return [1]; // [affectedRows]
  }
};

// Function to initialize database (no schema creation needed as we're using pre-existing tables)
const initialize = async () => {
  try {
    // Just verify that we can connect to the tables
    await executeQuery('SELECT 1 FROM resolving LIMIT 1');
    console.log('Resolution database connection verified successfully');
  } catch (error) {
    console.error('Error verifying database tables:', error);
    throw error;
  }
};

module.exports = {
  Resolution,
  initialize
}; 