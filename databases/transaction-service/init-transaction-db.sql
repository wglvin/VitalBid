-- Create a separate database for the Transaction service
CREATE DATABASE IF NOT EXISTS transaction_db;
USE transaction_db;

-- Create the transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,      -- reference to user (not enforced by FK here)
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;
