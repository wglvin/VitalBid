USE listing_db;

-- Create the organs table 
CREATE TABLE IF NOT EXISTS organs (
    id VARCHAR(36) PRIMARY KEY,
    type VARCHAR(255) NOT NULL UNIQUE,
    description TEXT
);

-- Create the listings table 
CREATE TABLE IF NOT EXISTS listings (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    startingPrice DECIMAL(10, 2) NOT NULL,
    status ENUM('active', 'pending', 'completed', 'cancelled') DEFAULT 'active',
    expiryDate DATETIME NOT NULL,
    organId VARCHAR(36) NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organId) REFERENCES organs(id)
);

-- Insert initial organ types
INSERT INTO organs (id, type, description) VALUES 
(UUID(), 'Heart', 'Vital organ that pumps blood through the body'),
(UUID(), 'Lung', 'Essential respiratory organ for oxygen exchange'),
(UUID(), 'Liver', 'Organ for detoxification and metabolism'),
(UUID(), 'Kidney', 'Filters blood and removes waste'),
(UUID(), 'Eye', 'Organ of vision'),
(UUID(), 'Pancreas', 'Produces digestive enzymes and insulin'),
(UUID(), 'Blood', 'Vital body fluid'); 
