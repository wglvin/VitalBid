import json
import logging
import uuid
import datetime
import os
from dotenv import load_dotenv
from kafka import KafkaProducer

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Kafka configuration
KAFKA_BOOTSTRAP_SERVERS = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092')
KAFKA_BID_TOPIC = os.getenv('KAFKA_BID_TOPIC', 'successful-bids')
KAFKA_BID_UPDATES_TOPIC = os.getenv('KAFKA_BID_UPDATES_TOPIC', 'bid-updates')

producer = None

def connect_producer():
    """Connect to Kafka and return the producer instance."""
    global producer
    if producer is not None:
        return producer

    try:
        logger.info(f"Connecting to Kafka at {KAFKA_BOOTSTRAP_SERVERS}")
        producer = KafkaProducer(
            bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            retries=5,
            retry_backoff_ms=500
        )
        logger.info("Kafka producer connected successfully")

        # Send a test message to verify connectivity
        test_message = {
            'event_type': 'producer_started',
            'timestamp': datetime.datetime.now().isoformat(),
            'message': 'Kafka producer started'
        }
        producer.send(KAFKA_BID_TOPIC, test_message)
        producer.flush()
        logger.info(f"Test message sent to topic {KAFKA_BID_TOPIC}")
        return producer

    except Exception as e:
        logger.error(f"Failed to connect to Kafka: {e}")
        return None

def produce_message(topic, event_type, data):
    """Produce a message to a Kafka topic with a standard format."""
    kafka_producer = connect_producer()
    if kafka_producer is None:
        logger.warning("Kafka producer not available, skipping event publishing")
        return False

    message = {
        'event_id': str(uuid.uuid4()),
        'event_type': event_type,
        'timestamp': datetime.datetime.now().isoformat(),
        **data
    }
    try:
        logger.info(f"Publishing message to topic '{topic}' with event '{event_type}'")
        future = kafka_producer.send(topic, message)
        record_metadata = future.get(timeout=10)
        kafka_producer.flush()
        logger.info(f"Message published to topic '{topic}', partition {record_metadata.partition}, offset {record_metadata.offset}")
        return True

    except Exception as e:
        logger.error(f"Error producing message to {topic}: {e}")
        return False

def publish_successful_bid(bid_data):
    """Publish a successful bid event to Kafka."""
    return produce_message(KAFKA_BID_TOPIC, 'successful_bid', bid_data)

def publish_bid_update(bid_data):
    """Publish a bid update event to Kafka."""
    return produce_message(KAFKA_BID_UPDATES_TOPIC, 'bid_status_update', bid_data)

def shutdown_producer():
    """Gracefully shut down the Kafka producer."""
    global producer
    if producer is not None:
        logger.info("Shutting down Kafka producer")
        producer.flush()
        producer.close()
        producer = None
        logger.info("Kafka producer disconnected")
