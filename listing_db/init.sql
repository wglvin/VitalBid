-- Remove the CREATE DATABASE and \c commands, just create tables
CREATE TABLE OrganType (
    Type_ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(255) NOT NULL
);

CREATE TABLE Listing (
    Listing_ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    Time_End DATETIME NOT NULL,
    Start_Bid DECIMAL(10,2) NOT NULL,
    Bid_Inc DECIMAL(10,2) NOT NULL,
    Status VARCHAR(50) NOT NULL,
    Type_ID INT,
    FOREIGN KEY (Type_ID) REFERENCES OrganType(Type_ID)
); 