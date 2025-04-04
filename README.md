# Organ Auction Platform

## Description
Our organ auction platform addresses the critical shortage of accessible organ procurement systems by creating a free marketplace for people who require organs to source for them. The frontend communicates with the backend microservices through the Kong API Gateway, there is ZERO direct frontend interaction with all microservices.

Key features of our organ auction platform include:
1.	Secure registration for both buyers and sellers
2.	Creation of Organ Types/ Listings
3.	Real-time bidding system for available listings
4.	Support Payments through Stripe Payments API
5.	Receive Email Notification through Mailgun API

Frontend also allows:
1.	View all organ listings with filtering by status (active/ended)
2.	View listing details with bid history
3.	View one's bids/listings

## File Structure
- Frontend Built and Run in frontend-html folder, run by nginx
- Backend Microservices are each in their seperate folder, each run by flask OR node.js

## Prerequisites
- Docker 27.5.1
- Ensure that ports to be used are not currently used by other programs
- Approved Mailgun email request, search for "Mailgun<support@mailgun.net>" in inbox, cXXXXXXt@smu.edu.sg & lXXXXXXg@smu.edu.sg have been requested

## Running Repo 
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

