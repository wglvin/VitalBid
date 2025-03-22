USE listing_db;

-- Create the organs table 
CREATE TABLE IF NOT EXISTS organs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(255) NOT NULL UNIQUE,
    description TEXT
);

-- Create the listings table 
CREATE TABLE IF NOT EXISTS listings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    startingPrice DECIMAL(10, 2) NOT NULL,
    status ENUM('active', 'pending', 'completed', 'cancelled') DEFAULT 'active',
    expiryDate DATETIME NOT NULL,
    ownerId INT NOT NULL,
    organId INT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organId) REFERENCES organs(id)
);

-- Insert initial organ types
INSERT INTO organs (type, description) VALUES 
('Heart', 'Vital organ that pumps blood through the body'),
('Lung', 'Essential respiratory organ for oxygen exchange'),
('Liver', 'Organ for detoxification and metabolism'),
('Kidney', 'Filters blood and removes waste'),
('Eye', 'Organ of vision'),
('Pancreas', 'Produces digestive enzymes and insulin'),
('Blood', 'Vital body fluid'); 
