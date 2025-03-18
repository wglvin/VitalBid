# Organ Auction Platform

## Description
Our organ auction platform addresses the critical shortage of accessible organ procurement systems by creating a free marketplace for people who require organ to source for them.

Key features of our organ auction platform include:
1.	Secure registration for both buyers and sellers
2.	Real-time bidding system for available organs
3.	Emphasis on immutability, ensuring that listings cannot be tampered
4.  Escrow of funds once a bid is placed

## Prerequisites
- Docker 27.5.1

## File Structure
Frontend Folder: Website, run by node.js
Backend Folder: Microservices, each run by flask OR node.js


## Running ALL Docker Images 
1. Check if any docker images are already running
   ```sh
   docker ps
   ```
2. Stop any running docker images  
   ```sh
   docker stop <container_id>
   ```

3. Build & Run all docker images in folder ONLY
   ```sh
   docker-compose up -d --build
   ```
   OR
3. Remove database volumes declared (reset tables to fresh state) before building again
   ```sh
   docker-compose down -v && docker-compose up -d --build
   ```

## .env file
1. Get .env credentials from meepok xoxo

### External Port Binding Legend
30xx: Atomic Microservices </br>
33xx: Atomic Database Microservices </br>
50xx: Composite Microservices </br>
80xx: External Techology Microservices </br>

## External Ports in Use
3001: List Microservice </br>
3002: Bid Microservice </br>
3306: List Database </br>
3307: Bid Database </br>
5001: View Listing & Bid Service </br>
8000: Kong API Gateway
8001: Kong Admin

## Contributing Guidelines
When contributing to this project, please follow these commit message guidelines:
* For changes specific to an Image: "[Image]: [Message]"
* For project-wide changes: "Project: [Message]"
