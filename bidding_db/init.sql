-- Remove the CREATE DATABASE and \c commands, just create table
CREATE TABLE Bid (
    Bid_ID SERIAL PRIMARY KEY,
    Listing_ID INT,
    Time_Placed TIMESTAMP NOT NULL,
    Bid_Amt DECIMAL(10,2) NOT NULL
); 