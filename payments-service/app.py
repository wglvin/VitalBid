from flask import Flask, request, jsonify
from flask_cors import CORS
import stripe
import json
import os
import sys
from dotenv import load_dotenv
from pathlib import Path
import logging
import datetime

# Add the payments-service directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
# Import the Kafka functions
from kafka_lib.kafkaProducer import publish_successful_bid, publish_bid_update

# Load environment variables
env_path = Path(__file__).resolve().parents[1] / '.env'
load_dotenv(dotenv_path=env_path)
# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app) 

# Configure Stripe
stripe.api_key = os.getenv('STRIPE_API_KEY')

# In-memory storage for payment intents and bids (would be a database in production)
payment_intents = {}
bids = {}  # Store bid information

@app.route('/v1/payment_intents', methods=['POST'])
def create_payment_intent():
    logger.info("Received request to /v1/payment_intents")
    """Create a payment intent and return client secret"""
    try:
        data = request.json
        amount = data.get('amount')
        currency = data.get('currency', 'usd')
        bid_id = data.get('bid_id')
        
        if not amount:
            return jsonify({'error': 'Amount is required'}), 400
        
        if not bid_id:
            return jsonify({'error': 'Bid ID is required'}), 400
        
        # Create payment intent with Stripe - changing confirm to False to follow standard flow
        intent = stripe.PaymentIntent.create(
            amount=int(amount * 100),  # Stripe expects amount in cents
            currency=currency,
            metadata={'bid_id': bid_id}
        )
        
        # Store payment intent with bid information
        payment_intents[intent.id] = {
            'id': intent.id,
            'bid_id': bid_id,
            'amount': amount,
            'currency': currency,
            'status': intent.status,
            'client_secret': intent.client_secret
        }
        
        # Store or update bid information
        if bid_id not in bids:
            bids[bid_id] = {
                'bid_id': bid_id,
                'payment_intents': [intent.id],
                'status': 'pending_payment',
                'created_at': datetime.datetime.now().isoformat()
            }
        else:
            bids[bid_id]['payment_intents'].append(intent.id)
            bids[bid_id]['updated_at'] = datetime.datetime.now().isoformat()
        
        logger.info(f"Payment intent created: {intent.id} for bid: {bid_id}")
        
        return jsonify({
            'id': intent.id,
            'client_secret': intent.client_secret,
            'status': intent.status
        }), 201
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {str(e)}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error creating payment intent: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/v1/payment_intents/<payment_intent_id>/confirm', methods=['POST'])
def confirm_payment_intent(payment_intent_id):
    """Confirm a payment intent and publish successful bid event to Kafka"""
    try:
        # Retrieve payment intent from Stripe
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        
        if intent.status == 'succeeded':
            bid_id = intent.metadata.get('bid_id')
            
            # Update local storage
            if payment_intent_id in payment_intents:
                payment_intents[payment_intent_id]['status'] = 'succeeded'
            
            # Update bid status if it exists
            if bid_id in bids:
                bids[bid_id]['status'] = 'payment_succeeded'
                bids[bid_id]['updated_at'] = datetime.datetime.now().isoformat()
            
            # Publish successful bid event to Kafka
            event_published = False
            if bid_id:
                event_data = {
                    'bid_id': bid_id,
                    'payment_intent_id': payment_intent_id,
                    'amount': intent.amount / 100,  # Convert back from cents
                    'currency': intent.currency,
                    'status': 'succeeded',
                    'metadata': intent.metadata
                }
                
                # Use the simplified Kafka producer
                event_published = publish_successful_bid(event_data)
            else:
                logger.warning(f"Bid ID missing, couldn't publish event for payment: {payment_intent_id}")
            
            return jsonify({
                'id': intent.id,
                'status': intent.status,
                'bid_id': bid_id,
                'event_published': event_published
            }), 200
        else:
            return jsonify({
                'id': intent.id,
                'status': intent.status,
                'message': 'Payment has not succeeded yet'
            }), 200  # Changed from 400 to 200 to avoid error state
            
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {str(e)}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error confirming payment intent: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

# New endpoint to check payment status
@app.route('/v1/payment_intents/<payment_intent_id>/status', methods=['GET'])
def check_payment_status(payment_intent_id):
    """Check the status of a payment intent"""
    try:
        # Try to retrieve from local storage first
        if payment_intent_id in payment_intents:
            # But still verify with Stripe to get the most up-to-date status
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            payment_intents[payment_intent_id]['status'] = intent.status
            
            return jsonify({
                'id': intent.id,
                'status': intent.status,
                'client_secret': payment_intents[payment_intent_id]['client_secret']
            }), 200
        else:
            # If not in local storage, get from Stripe
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            
            # Store it for future reference
            payment_intents[payment_intent_id] = {
                'id': intent.id,
                'status': intent.status,
                'client_secret': intent.client_secret,
                'amount': intent.amount / 100,
                'currency': intent.currency
            }
            
            return jsonify({
                'id': intent.id,
                'status': intent.status,
                'client_secret': intent.client_secret
            }), 200
            
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error checking payment status: {str(e)}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error checking payment status: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/v1/bids/<bid_id>/update', methods=['POST'])
def update_bid_status(bid_id):
    """Update a bid's status and publish the event to Kafka"""
    try:
        data = request.json
        new_status = data.get('status')
        payment_intent_id = data.get('payment_intent_id')
        
        if not new_status:
            return jsonify({'error': 'Status is required'}), 400
            
        # Find associated payment intent if provided
        payment_data = {}
        if payment_intent_id:
            try:
                intent = stripe.PaymentIntent.retrieve(payment_intent_id)
                payment_data = {
                    'payment_intent_id': payment_intent_id,
                    'payment_status': intent.status,
                    'amount': intent.amount / 100 if hasattr(intent, 'amount') else None,
                    'currency': intent.currency if hasattr(intent, 'currency') else None
                }
            except Exception as e:
                logger.warning(f"Failed to retrieve payment intent {payment_intent_id}: {str(e)}")
        
        # Prepare event data
        event_data = {
            'bid_id': bid_id,
            'previous_status': data.get('previous_status'),
            'new_status': new_status,
            'updated_by': data.get('updated_by'),
            'reason': data.get('reason'),
            **payment_data,
            'additional_data': data.get('additional_data', {})
        }
        
        # Use simplified Kafka producer
        event_published = publish_bid_update(event_data)
        
        return jsonify({
            'bid_id': bid_id,
            'status': new_status,
            'event_published': event_published
        }), 200
        
    except Exception as e:
        logger.error(f"Error updating bid status: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/v1/bids/<bid_id>', methods=['GET'])
def get_bid_info(bid_id):
    """Get bid information including payment status"""
    try:
        if bid_id not in bids:
            return jsonify({'error': 'Bid not found'}), 404
        
        bid_info = bids[bid_id].copy()
        
        # Get payment intent details
        payment_details = []
        for payment_intent_id in bid_info.get('payment_intents', []):
            if payment_intent_id in payment_intents:
                payment_details.append(payment_intents[payment_intent_id])
            else:
                try:
                    # Try to get from Stripe if not in local storage
                    intent = stripe.PaymentIntent.retrieve(payment_intent_id)
                    payment_details.append({
                        'id': intent.id,
                        'status': intent.status,
                        'amount': intent.amount / 100,
                        'currency': intent.currency
                    })
                except Exception as e:
                    logger.warning(f"Could not retrieve payment intent {payment_intent_id}: {str(e)}")
        
        bid_info['payment_details'] = payment_details
        
        return jsonify(bid_info), 200
    
    except Exception as e:
        logger.error(f"Error retrieving bid information: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/')
def home():
    return jsonify({'message': 'Hello, Flask API is running!'})


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'}), 200


if __name__ == '__main__':
    # Explicitly set port to 5001 regardless of environment variable
    port = 5002
    logger.info(f"Starting Flask app on port {port}")
    # Use debug=True to see more detailed errors
    port = int(os.getenv('PORT', 5002))
    app.run(host='0.0.0.0', port=port)
else:
    # Log if the file is being imported rather than run directly
    logger.warning("This script is being imported, not run directly. The Flask app will not start automatically.")