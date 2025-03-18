import os
import json
import requests
from datetime import datetime, timedelta
import uuid
import hashlib
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from werkzeug.exceptions import NotFound, BadRequest, InternalServerError
from werkzeug.utils import secure_filename

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure service URLs from environment variables
LISTING_SERVICE_URL = os.environ.get('LISTING_SERVICE_URL')
BIDDING_SERVICE_URL = os.environ.get('BIDDING_SERVICE_URL')
PORT = int(os.environ.get('PORT', 5001))

# Create a directory for storing proof files
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
os.makedirs(os.path.join(UPLOAD_FOLDER, 'proofs'), exist_ok=True)
os.makedirs(os.path.join(UPLOAD_FOLDER, 'images'), exist_ok=True)

# In-memory storage for proofs (in a real app, this would be a database)
proofs = {}
image_proofs = {}

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for the service."""
    return jsonify({
        'status': 'ok',
        'service': 'view-listing-bids-service'
    })

# ADAPTER ENDPOINTS FOR FRONTEND COMPATIBILITY

@app.route('/api/listings/all_listing', methods=['GET'])
def get_all_listings():
    """Fetch all listings in a format compatible with the frontend."""
    try:
        # Fetch listings from the listing service
        listings_response = requests.get(f"{LISTING_SERVICE_URL}/api/listings")
        
        if listings_response.status_code != 200:
            return jsonify({
                'message': f'Error fetching listings: {listings_response.status_code}',
                'details': listings_response.text
            }), 500
            
        backend_listings = listings_response.json()
        
        # Transform data to frontend format
        frontend_listings = []
        
        for listing in backend_listings:
            # Calculate bid count and current bid from bidding service
            bids_response = requests.get(f"{BIDDING_SERVICE_URL}/api/bids/listing/{listing['id']}")
            bids = []
            if bids_response.status_code == 200:
                bids = bids_response.json()
            
            # Get highest bid
            highest_bid_response = requests.get(f"{BIDDING_SERVICE_URL}/api/bids/highest/{listing['id']}")
            current_bid = None
            if highest_bid_response.status_code == 200:
                highest_bid_data = highest_bid_response.json()
                if 'highestBid' in highest_bid_data and highest_bid_data['highestBid']:
                    current_bid = float(highest_bid_data['highestBid']['amount'])
            
            # Map backend listing to frontend format
            frontend_listing = {
                'listing_id': listing['id'],
                'name': listing['title'],
                'time_end': listing['expiryDate'],
                'start_bid': float(listing['startingPrice']),
                'bid_inc': 500,  # Default increment, could be configurable
                'status': 'ACTIVE' if listing['status'] == 'active' else 'ENDED',
                'current_bid': current_bid,
                'bids_count': len(bids)
            }
            
            frontend_listings.append(frontend_listing)
        
        return jsonify(frontend_listings)
        
    except requests.RequestException as e:
        app.logger.error(f"Request error: {str(e)}")
        return jsonify({'message': 'Service communication error', 'error': str(e)}), 503
        
    except Exception as e:
        app.logger.error(f"Unexpected error: {str(e)}")
        return jsonify({'message': 'Internal server error', 'error': str(e)}), 500

@app.route('/api/listings/get_listing/<listing_id>', methods=['GET'])
def get_listing_by_id(listing_id):
    """Fetch a specific listing by ID in a format compatible with the frontend."""
    try:
        # Fetch listing from the listing service
        listing_response = requests.get(f"{LISTING_SERVICE_URL}/api/listings/{listing_id}")
        
        if listing_response.status_code == 404:
            return jsonify({'message': 'Listing not found'}), 404
            
        if listing_response.status_code != 200:
            return jsonify({
                'message': f'Error fetching listing: {listing_response.status_code}',
                'details': listing_response.text
            }), 500
        
        backend_listing = listing_response.json()
        
        # Get highest bid
        highest_bid_response = requests.get(f"{BIDDING_SERVICE_URL}/api/bids/highest/{listing_id}")
        current_bid = None
        if highest_bid_response.status_code == 200:
            highest_bid_data = highest_bid_response.json()
            if 'highestBid' in highest_bid_data and highest_bid_data['highestBid']:
                current_bid = float(highest_bid_data['highestBid']['amount'])
        
        # Map backend listing to frontend format
        frontend_listing = {
            'listing_id': backend_listing['id'],
            'name': backend_listing['title'],
            'time_end': backend_listing['expiryDate'],
            'start_bid': float(backend_listing['startingPrice']),
            'bid_inc': 500,  # Default increment, could be configurable
            'status': 'ACTIVE' if backend_listing['status'] == 'active' else 'ENDED',
            'current_bid': current_bid
        }
        
        return jsonify(frontend_listing)
        
    except requests.RequestException as e:
        app.logger.error(f"Request error: {str(e)}")
        return jsonify({'message': 'Service communication error', 'error': str(e)}), 503
        
    except Exception as e:
        app.logger.error(f"Unexpected error: {str(e)}")
        return jsonify({'message': 'Internal server error', 'error': str(e)}), 500

@app.route('/api/listings/add_listing', methods=['POST'])
def add_listing():
    """Create a new listing."""
    try:
        # Get data from frontend
        frontend_data = request.json
        
        # Transform to backend format
        backend_data = {
            'title': frontend_data.get('name'),
            'description': frontend_data.get('description', ''),
            'startingPrice': frontend_data.get('start_bid'),
            'expiryDate': frontend_data.get('time_end'),
            'donorId': frontend_data.get('donor_id', str(uuid.uuid4())),  # Generate UUID if not provided
            'organId': frontend_data.get('organ_id')
        }
        
        # Send to listing service
        response = requests.post(
            f"{LISTING_SERVICE_URL}/api/listings",
            json=backend_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code != 201:
            return jsonify({
                'message': f'Error creating listing: {response.status_code}',
                'details': response.text
            }), response.status_code
        
        # Return the created listing in frontend format
        new_listing = response.json()
        
        frontend_result = {
            'listing_id': new_listing['id'],
            'name': new_listing['title'],
            'time_end': new_listing['expiryDate'],
            'start_bid': float(new_listing['startingPrice']),
            'bid_inc': 500,  # Default increment
            'status': 'ACTIVE'
        }
        
        return jsonify(frontend_result), 201
        
    except Exception as e:
        app.logger.error(f"Error creating listing: {str(e)}")
        return jsonify({'message': 'Failed to create listing', 'error': str(e)}), 500

@app.route('/api/bidding/get_history/<listing_id>', methods=['GET'])
def get_bid_history(listing_id):
    """Get bid history for a listing in frontend format."""
    try:
        # Fetch bids from the bidding service
        response = requests.get(f"{BIDDING_SERVICE_URL}/api/bids/listing/{listing_id}")
        
        if response.status_code != 200:
            return jsonify({
                'message': f'Error fetching bids: {response.status_code}',
                'details': response.text
            }), response.status_code
        
        backend_bids = response.json()
        
        # Transform to frontend format
        frontend_bids = []
        
        for bid in backend_bids:
            frontend_bid = {
                'bid_id': bid['id'],
                'listing_id': bid['listingId'],
                'bid_amt': float(bid['amount']),
                'bid_time': bid['bidTime']
            }
            frontend_bids.append(frontend_bid)
        
        # Sort by bid amount descending (highest first)
        frontend_bids.sort(key=lambda x: x['bid_amt'], reverse=True)
        
        return jsonify(frontend_bids)
    
    except Exception as e:
        app.logger.error(f"Error fetching bid history: {str(e)}")
        return jsonify({'message': 'Failed to fetch bid history', 'error': str(e)}), 500

@app.route('/api/bidding/add_bid', methods=['POST'])
def place_bid():
    """Place a bid on a listing."""
    try:
        # Get data from frontend
        frontend_data = request.json
        
        # Transform to backend format
        backend_data = {
            'listingId': frontend_data.get('listing_id'),
            'bidderId': frontend_data.get('bidder_id', str(uuid.uuid4())),  # Generate UUID if not provided
            'amount': frontend_data.get('bid_amt')
        }
        
        # Send to bidding service
        response = requests.post(
            f"{BIDDING_SERVICE_URL}/api/bids",
            json=backend_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code != 201:
            return jsonify({
                'message': f'Error placing bid: {response.status_code}',
                'details': response.text
            }), response.status_code
        
        # Return the created bid in frontend format
        new_bid = response.json()
        
        frontend_result = {
            'bid_id': new_bid['id'],
            'listing_id': new_bid['listingId'],
            'bid_amt': float(new_bid['amount']),
            'bid_time': new_bid['bidTime']
        }
        
        return jsonify(frontend_result), 201
        
    except Exception as e:
        app.logger.error(f"Error placing bid: {str(e)}")
        return jsonify({'message': 'Failed to place bid', 'error': str(e)}), 500

# PROOF SERVICE ENDPOINTS (SIMPLIFIED IMPLEMENTATION)

@app.route('/api/proof/get_proof/listing/<listing_id>', methods=['GET'])
def get_listing_proof(listing_id):
    """Get proof document for a listing."""
    try:
        if listing_id not in proofs:
            return jsonify({'message': 'No proof found for this listing'}), 404
        
        return jsonify(proofs[listing_id])
        
    except Exception as e:
        app.logger.error(f"Error fetching proof: {str(e)}")
        return jsonify({'message': 'Failed to fetch proof', 'error': str(e)}), 500

@app.route('/api/proof/get_proof/image/<listing_id>', methods=['GET'])
def get_image_proof(listing_id):
    """Get image proof for a listing."""
    try:
        if listing_id not in image_proofs:
            return jsonify({'message': 'No image proof found for this listing'}), 404
        
        return jsonify(image_proofs[listing_id])
        
    except Exception as e:
        app.logger.error(f"Error fetching image proof: {str(e)}")
        return jsonify({'message': 'Failed to fetch image proof', 'error': str(e)}), 500

@app.route('/api/proof/upload_proof', methods=['POST'])
def upload_proof():
    """Upload a proof document for a listing."""
    try:
        listing_id = request.form.get('listing_id')
        if not listing_id:
            return jsonify({'message': 'Listing ID is required'}), 400
        
        if 'proof_file' not in request.files:
            return jsonify({'message': 'No file part'}), 400
            
        file = request.files['proof_file']
        
        if file.filename == '':
            return jsonify({'message': 'No selected file'}), 400
            
        if file:
            filename = secure_filename(f"{listing_id}_{file.filename}")
            file_path = os.path.join(UPLOAD_FOLDER, 'proofs', filename)
            file.save(file_path)
            
            # Generate hash of the file contents
            file_hash = hashlib.sha256(open(file_path, 'rb').read()).hexdigest()
            
            # Create proof record
            proof = {
                'proof_id': str(uuid.uuid4()),
                'listing_id': listing_id,
                'proof_hash': file_hash,
                'upload_time': datetime.now().isoformat(),
                'verified': False  # Initially not verified
            }
            
            # Store in memory
            proofs[listing_id] = proof
            
            return jsonify(proof), 201
        
        return jsonify({'message': 'Error processing file'}), 500
        
    except Exception as e:
        app.logger.error(f"Error uploading proof: {str(e)}")
        return jsonify({'message': 'Failed to upload proof', 'error': str(e)}), 500

@app.route('/api/proof/upload_image_proof', methods=['POST'])
def upload_image_proof():
    """Upload an image proof for a listing."""
    try:
        listing_id = request.form.get('listing_id')
        if not listing_id:
            return jsonify({'message': 'Listing ID is required'}), 400
        
        if 'image_file' not in request.files:
            return jsonify({'message': 'No file part'}), 400
            
        file = request.files['image_file']
        
        if file.filename == '':
            return jsonify({'message': 'No selected file'}), 400
            
        if file:
            filename = secure_filename(f"{listing_id}_{file.filename}")
            file_path = os.path.join(UPLOAD_FOLDER, 'images', filename)
            file.save(file_path)
            
            # Create image proof record
            image_proof = {
                'image_id': str(uuid.uuid4()),
                'listing_id': listing_id,
                'image_url': f"/api/proof/images/{filename}",  # URL to access the image
                'upload_time': datetime.now().isoformat()
            }
            
            # Store in memory
            image_proofs[listing_id] = image_proof
            
            return jsonify(image_proof), 201
        
        return jsonify({'message': 'Error processing image'}), 500
        
    except Exception as e:
        app.logger.error(f"Error uploading image proof: {str(e)}")
        return jsonify({'message': 'Failed to upload image proof', 'error': str(e)}), 500

@app.route('/api/proof/images/<filename>', methods=['GET'])
def get_image(filename):
    """Serve uploaded images."""
    return send_from_directory(os.path.join(UPLOAD_FOLDER, 'images'), filename)

# ORIGINAL COMPOSITE SERVICE ENDPOINTS
# [... existing code for the original endpoints ...]

def calculate_bid_stats(bids):
    """Calculate statistics for a collection of bids."""
    if not bids:
        return None
        
    amounts = [float(bid['amount']) for bid in bids]
    return {
        'min_bid': min(amounts),
        'max_bid': max(amounts),
        'avg_bid': sum(amounts) / len(amounts),
        'bid_count': len(bids)
    }
# Add these endpoints to your app.py file

@app.route('/api/organs/all', methods=['GET'])
def get_all_organs():
    """Fetch all organ types."""
    try:
        # Fetch organs from the listing service
        response = requests.get(f"{LISTING_SERVICE_URL}/api/organs")
        
        if response.status_code != 200:
            return jsonify({
                'message': f'Error fetching organs: {response.status_code}',
                'details': response.text
            }), response.status_code
        
        # Return the organs directly as the format is compatible
        organs = response.json()
        return jsonify(organs)
        
    except Exception as e:
        app.logger.error(f"Error fetching organs: {str(e)}")
        return jsonify({'message': 'Failed to fetch organs', 'error': str(e)}), 500

@app.route('/api/organs/<organ_id>', methods=['GET'])
def get_organ_by_id(organ_id):
    """Fetch a specific organ type by ID."""
    try:
        # Fetch organ from the listing service
        response = requests.get(f"{LISTING_SERVICE_URL}/api/organs/{organ_id}")
        
        if response.status_code != 200:
            return jsonify({
                'message': f'Error fetching organ: {response.status_code}',
                'details': response.text
            }), response.status_code
        
        # Return the organ directly as the format is compatible
        organ = response.json()
        return jsonify(organ)
        
    except Exception as e:
        app.logger.error(f"Error fetching organ: {str(e)}")
        return jsonify({'message': 'Failed to fetch organ', 'error': str(e)}), 500


@app.route('/api/organs/add', methods=['POST'])
def add_organ():
    """Create a new organ type."""
    try:
        # Log the incoming request
        app.logger.info(f"Received request to add organ: {request.get_data()}")
        
        # Get data from frontend
        frontend_data = request.json
        if not frontend_data:
            app.logger.error("No JSON data received")
            return jsonify({"message": "No JSON data received"}), 400
            
        app.logger.info(f"Parsed JSON data: {frontend_data}")
            
        # Transform to backend format if needed
        backend_data = {
            'type': frontend_data.get('type'),
            'description': frontend_data.get('description', '')
        }
        
        if not backend_data['type']:
            app.logger.error("Organ type is required")
            return jsonify({"message": "Organ type is required"}), 400
        
        # Log the request for debugging
        app.logger.info(f"Sending to listing service: {backend_data}")
        
        # Send to listing service
        try:
            response = requests.post(
                f"{LISTING_SERVICE_URL}/api/organs",
                json=backend_data,
                headers={"Content-Type": "application/json"},
                timeout=5  # Add timeout
            )
            
            # Log response
            app.logger.info(f"Listing service response: {response.status_code}")
            app.logger.info(f"Response body: {response.text}")
            
            if response.status_code != 201:
                # Return the error from the listing service
                error_msg = f"Listing service error: {response.status_code} - {response.text}"
                app.logger.error(error_msg)
                return jsonify({"message": error_msg}), response.status_code
            
            # Return the created organ
            new_organ = response.json()
            return jsonify(new_organ), 201
            
        except requests.RequestException as e:
            error_msg = f"Error communicating with listing service: {str(e)}"
            app.logger.error(error_msg)
            return jsonify({"message": error_msg}), 500
        
    except Exception as e:
        error_msg = f"Unexpected error creating organ: {str(e)}"
        app.logger.error(error_msg)
        import traceback
        app.logger.error(traceback.format_exc())
        return jsonify({"message": error_msg}), 500
    
if __name__ == '__main__':
    print(f"Starting adapter service on port {PORT}")
    app.run(host='0.0.0.0', port=PORT)