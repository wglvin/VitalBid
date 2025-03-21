#!/usr/bin/env python3
"""
Simplified Kafka Consumer for Stripe Events
This script monitors multiple Stripe-related Kafka topics using only kafka-python library
"""

import json
import argparse
import logging
from datetime import datetime
from kafka import KafkaConsumer

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("stripe_events.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Topics to monitor - add or remove as needed
DEFAULT_TOPICS = [
    'successful-bids',
    'payment_intent.created',
    'payment_intent.succeeded',
    'payment_intent.payment_failed',
    'stripe-events',  # Generic topic that might collect all Stripe events
    'payment-events'  # Another possible generic topic
]

def parse_args():
    parser = argparse.ArgumentParser(description='Kafka consumer for Stripe payment events')
    parser.add_argument('--bootstrap-server', type=str, default='localhost:9092', 
                        help='Kafka bootstrap server')
    parser.add_argument('--group-id', type=str, default='stripe-events-consumer', 
                        help='Consumer group ID')
    parser.add_argument('--topics', type=str, nargs='+', default=DEFAULT_TOPICS,
                        help=f'Kafka topics to consume (default: {DEFAULT_TOPICS})')
    return parser.parse_args()

def main():
    logger.info("=" * 80)
    logger.info("STRIPE KAFKA EVENT CONSUMER STARTED")
    logger.info("=" * 80)
    
    args = parse_args()
    
    logger.info(f"Starting Kafka consumer")
    logger.info(f"Bootstrap server: {args.bootstrap_server}")
    logger.info(f"Group ID: {args.group_id}")
    logger.info(f"Topics: {args.topics}")
    
    try:
        consumer = KafkaConsumer(
            *args.topics,
            bootstrap_servers=args.bootstrap_server,
            group_id=args.group_id,
            auto_offset_reset='earliest',
            enable_auto_commit=True,
            value_deserializer=lambda x: json.loads(x.decode('utf-8')) if x else None
        )
        
        logger.info("Consumer started successfully. Waiting for messages...")
        
        for message in consumer:
            try:
                topic = message.topic
                partition = message.partition
                offset = message.offset
                key = message.key.decode('utf-8') if message.key else None
                timestamp = datetime.fromtimestamp(message.timestamp/1000).strftime('%Y-%m-%d %H:%M:%S')
                
                logger.info(f"Received message from topic: {topic}")
                logger.info(f"Partition: {partition}, Offset: {offset}, Key: {key}, Timestamp: {timestamp}")
                
                # Pretty print the message value
                if message.value:
                    logger.info(f"Message value: {json.dumps(message.value, indent=2)}")
                else:
                    logger.info("Message value is None")
                
                # Check for specific payment intent IDs of interest
                if message.value and isinstance(message.value, dict):
                    # Extract ID based on expected message structure
                    # Adjust these paths based on your actual message structure
                    payment_intent_id = None
                    
                    # Try different paths where the ID might be found
                    if 'id' in message.value:
                        payment_intent_id = message.value['id']
                    elif 'data' in message.value and 'object' in message.value['data']:
                        if 'id' in message.value['data']['object']:
                            payment_intent_id = message.value['data']['object']['id']
                    
                    if payment_intent_id:
                        logger.info(f"Payment Intent ID: {payment_intent_id}")
                        
                        # Special handling for your specific payment intent
                        if 'pi_3R55fDRoJbU4bIcv1Sx6tnQ8' in payment_intent_id:
                            logger.info("!!! FOUND THE SPECIFIC PAYMENT INTENT YOU'RE LOOKING FOR !!!")
                
                logger.info("-" * 80)  # Separator for readability
                
            except Exception as e:
                logger.error(f"Error processing message: {e}")
                
    except Exception as e:
        logger.error(f"Error initializing consumer: {e}")

if __name__ == "__main__":
    main()