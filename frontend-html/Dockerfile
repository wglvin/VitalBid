# Use Nginx as the web server for the HTML frontend
FROM nginx:alpine

# Copy the frontend files
COPY . /usr/share/nginx/html

# Copy our custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose the port nginx runs on
EXPOSE 3000

# Nginx runs automatically when the container starts
CMD ["nginx", "-g", "daemon off;"] 