import requests
import json
import time

# Base URL for your Flask application
base_url = 'http://localhost:5000'

# Step 1: Create a test bid with a payment intent
bid_id = f"test-bid-{int(time.time())}"  # Create a unique bid ID
print(f"Testing with bid ID: {bid_id}")

# Create a payment intent
payment_data = {
    'amount': 100.00,  # $100
    'currency': 'usd',
    'bid_id': bid_id
}

print("Creating payment intent...")
response = requests.post(f"{base_url}/v1/payment_intents", json=payment_data)
result = response.json()

if response.status_code != 201:
    print(f"Failed to create payment intent: {result.get('error')}")
    exit(1)

payment_intent_id = result['id']
print(f"Payment intent created with ID: {payment_intent_id}")

# Step 2: Confirm the payment intent
print("\nConfirming payment intent...")
confirm_response = requests.post(f"{base_url}/v1/payment_intents/{payment_intent_id}/confirm")
confirm_result = confirm_response.json()

print(f"Confirmation response status code: {confirm_response.status_code}")
print(f"Confirmation response: {json.dumps(confirm_result, indent=2)}")

# Step 3: Verify if event was published to Kafka
if confirm_response.status_code == 200 and confirm_result.get('event_published') == True:
    print("\n✓ SUCCESS: Bid was successfully published to Kafka!")
    print(f"  - Bid ID: {confirm_result.get('bid_id')}")
    print(f"  - Payment ID: {confirm_result.get('id')}")
    print(f"  - Status: {confirm_result.get('status')}")
    print("\nCheck your Kafka consumer terminal to see the full message details.")
else:
    print("\n✗ FAILED: Bid was not published to Kafka or payment confirmation failed.")
    print("Check your application logs for error details.")

# Step 4: Verify the bid status via the API
print("\nRetrieving bid information...")
bid_response = requests.get(f"{base_url}/v1/bids/{bid_id}")
if bid_response.status_code == 200:
    bid_info = bid_response.json()
    print(f"Bid status: {bid_info.get('status')}")
    print(f"Payment details: {json.dumps(bid_info.get('payment_details'), indent=2)}")
else:
    print(f"Failed to retrieve bid information: {bid_response.status_code}")