-- Create a separate database for the Organs service
CREATE DATABASE IF NOT EXISTS organs_db;
USE organs_db;

-- Create the organs table
CREATE TABLE IF NOT EXISTS organs (
  id VARCHAR(36) NOT NULL,
  type VARCHAR(100) NOT NULL,       -- e.g., kidney, liver, heart
  status VARCHAR(50) NOT NULL DEFAULT 'available',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

