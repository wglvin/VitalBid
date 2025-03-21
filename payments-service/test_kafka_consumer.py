#!/usr/bin/env python3
"""
Simple script to test the Kafka consumer
"""
import os
import sys
import logging

# Add the kafka directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'kafka'))
from kafka_consumer import start_consumer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    logger.info("Starting Kafka consumer test")
    logger.info("Press Ctrl+C to exit")
    
    try:
        # Start consuming messages
        start_consumer()
    except KeyboardInterrupt:
        logger.info("Test stopped by user")
    except Exception as e:
        logger.error(f"Error during test: {str(e)}")
        
    logger.info("Kafka consumer test completed") 