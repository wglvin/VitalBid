-- Table to track resolution
CREATE TABLE IF NOT EXISTS resolving (
    id INT AUTO_INCREMENT PRIMARY KEY,
    listing_id INT NOT NULL,
    status ENUM('active', 'accepted', 'cancelled') DEFAULT 'active',
    winning_bid DECIMAL(10, 2) NOT NULL,
    winner_id INT NOT NULL,
    resolvedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for better query performance
    INDEX idx_listing_id (listing_id),
    INDEX idx_status (status),
    INDEX idx_winner_id (winner_id)
)
