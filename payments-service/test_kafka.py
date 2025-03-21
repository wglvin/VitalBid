#!/usr/bin/env python3
"""
Simple script to test Kafka connectivity and event publishing
"""
import os
import sys
import json
import logging
import uuid

# Add the kafka directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'kafka'))
from kafkaProducer import publish_successful_bid, publish_bid_update

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def test_kafka_publishing():
    """Test publishing events to Kafka"""
    logger.info("Testing Kafka event publishing")
    
    # Create a test bid ID
    bid_id = f"test-bid-{uuid.uuid4().hex[:8]}"
    logger.info(f"Using test bid ID: {bid_id}")
    
    # Test publishing a successful bid event
    logger.info("Testing successful bid event publishing...")
    bid_data = {
        'bid_id': bid_id,
        'payment_intent_id': f"pi_{uuid.uuid4().hex[:24]}",
        'amount': 100.00,
        'currency': 'usd',
        'status': 'succeeded',
        'metadata': {'test': True}
    }
    
    result = publish_successful_bid(bid_data)
    if result:
        logger.info("✅ Successfully published successful bid event")
    else:
        logger.error("❌ Failed to publish successful bid event")
    
    # Test publishing a bid update event
    logger.info("\nTesting bid update event publishing...")
    update_data = {
        'bid_id': bid_id,
        'previous_status': 'payment_succeeded',
        'new_status': 'processing_donation',
        'updated_by': 'test_script',
        'reason': 'Testing Kafka events'
    }
    
    result = publish_bid_update(update_data)
    if result:
        logger.info("✅ Successfully published bid update event")
    else:
        logger.error("❌ Failed to publish bid update event")
    
    logger.info("\nKafka testing completed")

if __name__ == "__main__":
    test_kafka_publishing() 