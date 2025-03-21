import json
import logging
import uuid
import datetime
import os
from dotenv import load_dotenv
# Import KafkaProducer from the correct package
from kafka.producer import KafkaProducer

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Kafka configuration
KAFKA_BOOTSTRAP_SERVERS = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092')
KAFKA_BID_TOPIC = os.getenv('KAFKA_BID_TOPIC', 'successful-bids')
KAFKA_BID_UPDATES_TOPIC = os.getenv('KAFKA_BID_UPDATES_TOPIC', 'bid-updates')

# Global producer instance
producer = None
is_producer_connected = False

def connect_producer():
    """Connect to Kafka and return the producer instance"""
    global producer, is_producer_connected
    
    if is_producer_connected and producer:
        return producer
        
    try:
        logger.info(f"Connecting to Kafka at {KAFKA_BOOTSTRAP_SERVERS}")
        
        producer = KafkaProducer(
            bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            retries=5,
            retry_backoff_ms=500
        )
        
        is_producer_connected = True
        logger.info("Kafka producer connected successfully")
        
        # Send a test message to verify connectivity
        test_message = {
            'event_type': 'producer_started',
            'timestamp': datetime.datetime.now().isoformat(),
            'message': 'Payment service Kafka producer started'
        }
        
        producer.send(KAFKA_BID_TOPIC, test_message)
        producer.flush()
        logger.info(f"Test message sent to topic {KAFKA_BID_TOPIC}")
        
        return producer
        
    except Exception as e:
        logger.error(f"Failed to connect to Kafka: {str(e)}")
        is_producer_connected = False
        producer = None
        return None

def produce_message(topic, event_type, data):
    """
    Produce a message to a Kafka topic
    Returns True if successful, False otherwise
    """
    try:
        # Connect producer if not already connected
        kafka_producer = connect_producer()
        if not kafka_producer:
            logger.warning("Kafka producer not available, skipping event publishing")
            return False
            
        # Prepare message with standard format
        message = {
            'event_id': str(uuid.uuid4()),
            'event_type': event_type,
            'timestamp': datetime.datetime.now().isoformat(),
            **data
        }
        
        # Log message being sent
        logger.info(f"Publishing message to topic {topic}: {event_type}")
        
        # Send message to Kafka
        future = kafka_producer.send(topic, message)
        record_metadata = future.get(timeout=10)
        
        # Ensure message is sent
        kafka_producer.flush()
        
        logger.info(f"Message published to topic {topic}, partition {record_metadata.partition}, offset {record_metadata.offset}")
        return True
        
    except Exception as e:
        logger.error(f"Error producing message to {topic}: {str(e)}")
        return False

def publish_successful_bid(bid_data):
    """Publish a successful bid event"""
    return produce_message(KAFKA_BID_TOPIC, 'successful_bid', bid_data)
    
def publish_bid_update(bid_data):
    """Publish a bid update event"""
    return produce_message(KAFKA_BID_UPDATES_TOPIC, 'bid_status_update', bid_data)
    
def shutdown():
    """Gracefully shutdown the Kafka producer"""
    global producer, is_producer_connected
    
    if is_producer_connected and producer:
        logger.info("Shutting down Kafka producer")
        producer.flush()
        producer.close()
        is_producer_connected = False
        logger.info("Kafka producer disconnected") 