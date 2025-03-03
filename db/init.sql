CREATE DATABASE IF NOT EXISTS organ_marketplace;
USE organ_marketplace;

-- Create the user if it doesn't exist (MySQL 8 syntax):
CREATE USER IF NOT EXISTS 'appuser'@'%' IDENTIFIED BY 'superSecureAppPassword';
GRANT ALL PRIVILEGES ON organ_marketplace.* TO 'appuser'@'%';

-- OrganType table
CREATE TABLE IF NOT EXISTS OrganType (
    Type_ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(255) NOT NULL
);

-- Listing table
CREATE TABLE IF NOT EXISTS Listing (
    Listing_ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    Time_End DATETIME NOT NULL,
    Start_Bid DOUBLE NOT NULL,
    Bid_Inc DOUBLE NOT NULL,
    Status VARCHAR(50) NOT NULL,
    Type_ID INT,
    FOREIGN KEY (Type_ID) REFERENCES OrganType(Type_ID)
);

-- Bid table
CREATE TABLE IF NOT EXISTS Bid (
    Bid_ID INT AUTO_INCREMENT PRIMARY KEY,
    Listing_ID INT,
    Time_Placed DATETIME NOT NULL,
    Bid_Amt DOUBLE NOT NULL,
    FOREIGN KEY (Listing_ID) REFERENCES Listing(Listing_ID)
);
