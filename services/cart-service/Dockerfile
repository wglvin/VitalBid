FROM golang:1.20-alpine

WORKDIR /app

# Copy Go module files and download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN go build -o cart-service

# Expose the port the service will run on
EXPOSE 8080

# Start the service
CMD ["./cart-service"]
