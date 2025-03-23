#!/usr/bin/env python3
"""
Test script to verify Kafka event publishing for payment flows
"""
import requests
import json
import time
import uuid
import logging
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Base URL for the Flask application
base_url = 'http://localhost:5001'

def test_payment_flow():
    """Test the entire payment flow and verify event publishing"""
    # Step 1: Generate unique test data
    bid_id = f"test-bid-{uuid.uuid4().hex[:8]}"
    amount = 50.00  # $50.00
    
    logger.info(f"Starting payment flow test with bid ID: {bid_id}")
    
    # Step 2: Create a payment intent
    logger.info("Creating payment intent...")
    payment_data = {
        'amount': amount,
        'currency': 'usd',
        'bid_id': bid_id
    }
    
    response = requests.post(f"{base_url}/v1/payment_intents", json=payment_data)
    if response.status_code != 201:
        logger.error(f"Failed to create payment intent: {response.status_code} - {response.text}")
        return False
    
    result = response.json()
    payment_intent_id = result.get('id')
    logger.info(f"Payment intent created with ID: {payment_intent_id}")
    
    # Step 3: Verify the payment intent exists
    logger.info(f"Verifying bid status...")
    bid_response = requests.get(f"{base_url}/v1/bids/{bid_id}")
    if bid_response.status_code != 200:
        logger.error(f"Failed to retrieve bid info: {bid_response.status_code} - {bid_response.text}")
    else:
        logger.info(f"Current bid status: {bid_response.json().get('status')}")
    
    # Step 4: Confirm the payment intent
    logger.info("Confirming payment intent...")
    confirm_response = requests.post(f"{base_url}/v1/payment_intents/{payment_intent_id}/confirm")
    if confirm_response.status_code != 200:
        logger.error(f"Failed to confirm payment: {confirm_response.status_code} - {confirm_response.text}")
        return False
    
    confirm_result = confirm_response.json()
    logger.info(f"Payment confirmed. Status: {confirm_result.get('status')}")
    
    # Step 5: Check if event was published to Kafka
    event_published = confirm_result.get('event_published', False)
    if event_published:
        logger.info("✅ SUCCESS: Kafka event was successfully published!")
    else:
        logger.error("❌ ERROR: Kafka event was NOT published")
        logger.info("Check server logs for Kafka connectivity issues")
    
    # Step 6: Verify updated bid status
    logger.info("Verifying final bid status...")
    final_bid_response = requests.get(f"{base_url}/v1/bids/{bid_id}")
    if final_bid_response.status_code == 200:
        bid_info = final_bid_response.json()
        logger.info(f"Final bid status: {bid_info.get('status')}")
        
        # Display payment details
        payment_details = bid_info.get('payment_details', [])
        if payment_details:
            logger.info(f"Payment details: {json.dumps(payment_details, indent=2)}")
        else:
            logger.warning("No payment details found")
    else:
        logger.error(f"Failed to retrieve final bid status: {final_bid_response.status_code}")
    
    # Step 7: Test a bid status update
    logger.info("\nTesting bid status update event...")
    update_data = {
        'status': 'processing_donation',
        'previous_status': 'payment_succeeded',
        'updated_by': 'system',
        'reason': 'Test update',
        'payment_intent_id': payment_intent_id
    }
    
    update_response = requests.post(f"{base_url}/v1/bids/{bid_id}/update", json=update_data)
    if update_response.status_code == 200:
        update_result = update_response.json()
        if update_result.get('event_published'):
            logger.info("✅ SUCCESS: Bid status update event was published to Kafka")
        else:
            logger.error("❌ ERROR: Bid status update event was NOT published to Kafka")
    else:
        logger.error(f"Failed to update bid status: {update_response.status_code} - {update_response.text}")
    
    logger.info("\nTest completed. Check your Kafka consumer logs to verify message reception.")
    return event_published

if __name__ == "__main__":
    try:
        # Check if the service is running
        health_check = requests.get(f"{base_url}/health")
        if health_check.status_code != 200:
            logger.error(f"Payment service is not available. Status: {health_check.status_code}")
            sys.exit(1)
            
        logger.info("Payment service is available. Starting test...")
        success = test_payment_flow()
        
        if success:
            logger.info("🎉 Test completed successfully!")
            sys.exit(0)
        else:
            logger.error("Test failed with errors. Check logs for details.")
            sys.exit(1)
            
    except requests.exceptions.ConnectionError:
        logger.error(f"Cannot connect to payment service at {base_url}. Is it running?")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        sys.exit(1) 