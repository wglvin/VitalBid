USE bidResolve_db;

-- Create the bids table that matches the structure used in the application
CREATE TABLE IF NOT EXISTS bids (
    id INT AUTO_INCREMENT PRIMARY KEY,
    listingId INT NOT NULL,
    bidderId INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status ENUM('active', 'accepted', 'cancelled') DEFAULT 'active',
    bidTime DATETIME DEFAULT CURRENT_TIMESTAMP,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (listingId)
); 