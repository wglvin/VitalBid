from flask import Flask, request, jsonify
from flask_cors import CORS
import stripe
from kafka import KafkaProducer
import json
import os
from dotenv import load_dotenv
import uuid
import logging



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

# In-memory storage for payment intents (would be a database in production)
payment_intents = {}

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
            
            # Publish successful bid event to Kafka
            if producer and bid_id:
                event_data = {
                    'event_type': 'successful_bid',
                    'bid_id': bid_id,
                    'payment_intent_id': payment_intent_id,
                    'amount': intent.amount / 100,  # Convert back from cents
                    'currency': intent.currency,
                    'timestamp': str(intent.created)
                }
                
                producer.send(kafka_topic, event_data)
                logger.info(f"Published successful bid event to Kafka for bid: {bid_id}")
            
            return jsonify({
                'id': intent.id,
                'status': intent.status,
                'bid_id': bid_id
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
        
@app.route('/')
def home():
    return jsonify({'message': 'Hello, Flask API is running!'})


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'}), 200


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port)