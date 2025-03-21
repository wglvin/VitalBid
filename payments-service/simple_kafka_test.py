#!/usr/bin/env python3
"""
Simple direct test of Kafka connectivity
"""
import json
import logging
from kafka.producer import KafkaProducer
import datetime
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_kafka():
    """Test direct Kafka connectivity"""
    try:
        logger.info("Testing direct Kafka connection")
        
        # Create producer
        producer = KafkaProducer(
            bootstrap_servers='localhost:9092',
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )
        
        # Create test message
        test_message = {
            'event_id': str(uuid.uuid4()),
            'event_type': 'test_event',
            'timestamp': datetime.datetime.now().isoformat(),
            'message': 'This is a test message'
        }
        
        # Send message
        logger.info("Sending test message to Kafka")
        future = producer.send('successful-bids', test_message)
        
        # Wait for it to be sent
        record_metadata = future.get(timeout=10)
        
        # Log success
        logger.info(f"Message sent to: {record_metadata.topic}, partition: {record_metadata.partition}, offset: {record_metadata.offset}")
        
        # Flush producer
        producer.flush()
        
        logger.info("✅ Kafka test successful")
        return True
        
    except Exception as e:
        logger.error(f"❌ Kafka test failed: {str(e)}")
        return False
        
if __name__ == "__main__":
    test_kafka() 