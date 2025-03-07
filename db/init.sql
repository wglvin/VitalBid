DROP DATABASE IF EXISTS organ_marketplace;

CREATE DATABASE organ_marketplace;

USE organ_marketplace;

CREATE TABLE OrganType (
    Type_ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(255) NOT NULL
);

CREATE TABLE Listing (
    Listing_ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    Time_End DATETIME NOT NULL,
    Start_Bid DOUBLE NOT NULL,
    Bid_Inc DOUBLE NOT NULL,
    Status VARCHAR(50) NOT NULL,
    Type_ID INT,
    FOREIGN KEY (Type_ID) REFERENCES OrganType(Type_ID)
);

CREATE TABLE Bid (
    Bid_ID INT AUTO_INCREMENT PRIMARY KEY,
    Listing_ID INT,
    Time_Placed DATETIME NOT NULL,
    Bid_Amt DOUBLE NOT NULL,
    FOREIGN KEY (Listing_ID) REFERENCES Listing(Listing_ID)
);
