USE listing_db;

-- Create the organs table that matches Sequelize ORM's structure
CREATE TABLE IF NOT EXISTS organs (
    id VARCHAR(36) PRIMARY KEY,
    type VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create the listings table that matches Sequelize ORM's structure
CREATE TABLE IF NOT EXISTS listings (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    startingPrice DECIMAL(10, 2) NOT NULL,
    status ENUM('active', 'pending', 'completed', 'cancelled') DEFAULT 'active',
    expiryDate DATETIME NOT NULL,
    donorId VARCHAR(36) NOT NULL,
    organId VARCHAR(36) NOT NULL,
    winningBidId VARCHAR(36),
    finalPrice DECIMAL(10, 2),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organId) REFERENCES organs(id)
);

-- Insert initial organ types
INSERT INTO organs (id, type, description, createdAt, updatedAt) VALUES 
(UUID(), 'Heart', 'Vital organ that pumps blood through the body', NOW(), NOW()),
(UUID(), 'Lung', 'Essential respiratory organ for oxygen exchange', NOW(), NOW()),
(UUID(), 'Liver', 'Organ for detoxification and metabolism', NOW(), NOW()),
(UUID(), 'Kidney', 'Filters blood and removes waste', NOW(), NOW()),
(UUID(), 'Eye', 'Organ of vision', NOW(), NOW()),
(UUID(), 'Pancreas', 'Produces digestive enzymes and insulin', NOW(), NOW()),
(UUID(), 'Blood', 'Vital body fluid', NOW(), NOW()); 
