# Organ Auction Platform

## Description
Our organ auction platform addresses the critical shortage of accessible organ procurement systems by creating a free marketplace for people who require organ to source for them.

Key features of our organ auction platform include:
1.	Secure registration for both buyers and sellers
2.	Real-time bidding system for available organs

## Prerequisites
- Docker 27.5.1
- Ensure that ports to be used are not currently used by other programs

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
3000: Frontend Application </br>
3001: List Microservice </br>
3002: Bid Microservice </br>
3003: Notification Microservice </br>
3004: Resolve Microservice </br>
3306: List Database </br>
3307: Bid Database </br>
3308: Resolve Database </br>
5001: View Listing & Bid Microservice </br>
5002: Payments Microservice </br>
8000: Kong API Gateway </br>
8001: Kong Admin </br>
8092: Kafka Microservice </br>
8093: Zookeeper Microservice </br>

## Frontend

The application uses a simple HTML/CSS/JavaScript-based frontend served by Nginx. The frontend communicates with the backend microservices through the Kong API Gateway, there is ZERO direct frontend interaction with the microservice

Key features:
- View all organ listings with filtering by status (active/ended)
- View listing details with bid history
- Place bids on active listings
- Create new organ listings

The frontend is built with vanilla JavaScript and styled with TailwindCSS for a clean, responsive design.

## Troubleshooting Guidelines 
When unable to use e.g. port 3306, use the following command (in case your mysql is running):
* 1. (Windows - kill mysql)
```sh
taskkill /IM mysqld.exe /F
```
* 1. (MacOS - find PID using)
```sh
sudo lsof -i :3306 
```
* 2. (MacOS - kill process by PID)
```sh
sudo kill -9 <PID>
```

## Contributing Guidelines
When contributing to this project, please follow these commit message guidelines:
* For changes specific to an Image: "[Image]: [Message]"
* For project-wide changes: "Project: [Message]"

