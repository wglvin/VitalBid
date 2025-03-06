# Use official Python image
FROM python:3.9

# Set working directory
WORKDIR /app

# Copy app files
COPY . /app

# Install dependencies
RUN pip install -r requirements.txt

# Expose the port the service runs on
EXPOSE 5001

# Run the application
CMD ["python", "app.py"]
