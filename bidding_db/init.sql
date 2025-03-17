-- Remove the CREATE DATABASE and \c commands, just create table
CREATE TABLE Bid (
    Bid_ID INT AUTO_INCREMENT PRIMARY KEY,
    Listing_ID INT,
    Time_Placed DATETIME NOT NULL,
    Bid_Amt DECIMAL(10,2) NOT NULL
); 