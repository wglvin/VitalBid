FROM node:16-alpine

WORKDIR /app

# Install MySQL client
RUN apk add --no-cache mysql-client

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the port the app runs on
EXPOSE 3001

# Command to run the application
CMD ["node", "index.js"] 