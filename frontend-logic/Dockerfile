# Updated Dockerfile for frontend-logic with newer Node.js version
FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies with --legacy-peer-deps flag
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy the rest of the application
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application in development mode
CMD ["npm", "run", "dev"]