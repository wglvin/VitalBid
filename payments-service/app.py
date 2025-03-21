from flask import Flask, request, jsonify
from flask_cors import CORS
import stripe
from kafka import KafkaProducer
import json
import os
from dotenv import load_dotenv
import uuid
import logging
import datetime



# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app) 

# Configure Stripe
stripe.api_key = os.getenv('STRIPE_API_KEY')

# Configure Kafka
kafka_bootstrap_servers = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092')
kafka_topic = os.getenv('KAFKA_BID_TOPIC', 'successful-bids')
kafka_bid_updates_topic = os.getenv('KAFKA_BID_UPDATES_TOPIC', 'bid-updates')

# Initialize Kafka producer
try:
    producer = KafkaProducer(
        bootstrap_servers=kafka_bootstrap_servers,
        value_serializer=lambda v: json.dumps(v).encode('utf-8')
    )
    logger.info("Kafka producer initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Kafka producer: {str(e)}")
    producer = None

# In-memory storage for payment intents and bids (would be a database in production)
payment_intents = {}
bids = {}  # Store bid information

def publish_to_kafka(topic, event_type, data):
    """
    Publish an event to Kafka with proper error handling
    Returns True if successful, False otherwise
    """
    if not producer:
        logger.warning("Kafka producer not available, skipping event publishing")
        return False
    
    try:
        event_data = {
            'event_id': str(uuid.uuid4()),
            'event_type': event_type,
            'timestamp': datetime.datetime.now().isoformat(),
            **data
        }
        
        # Send to Kafka and get the future result
        future = producer.send(topic, event_data)
        # Wait for the result to ensure it was sent
        record_metadata = future.get(timeout=10)
        
        logger.info(f"Published {event_type} event to Kafka: topic={record_metadata.topic}, "
                   f"partition={record_metadata.partition}, offset={record_metadata.offset}")
        return True
        
    except Exception as kafka_error:
        logger.error(f"Failed to publish {event_type} event to Kafka: {str(kafka_error)}")
        return False

@app.route('/v1/payment_intents', methods=['POST'])
def create_payment_intent():
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
        
        # Create payment intent with Stripe
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
                
                event_published = publish_to_kafka(kafka_topic, 'successful_bid', event_data)
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
            }), 400
            
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {str(e)}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error confirming payment intent: {str(e)}")
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
        
        # Publish event to Kafka
        event_published = publish_to_kafka(kafka_bid_updates_topic, 'bid_status_update', event_data)
        
        return jsonify({
            'bid_id': bid_id,
            'status': new_status,
            'event_published': event_published
        }), 200
        
    except Exception as e:
        logger.error(f"Error updating bid status: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port)