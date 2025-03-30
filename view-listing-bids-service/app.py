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

@app.route('/api/listings-with-bids', methods=['GET'])
def get_listings_with_bids():
    """
    Fetch all listings along with their associated bids.
    This endpoint aggregates data from both listing and bidding services.
    """
    try:
        # Step 1: Fetch all listings from the listing service
        listings_response = requests.get(f"{LISTING_SERVICE_URL}/api/listings")
        
        if listings_response.status_code != 200:
            return jsonify({
                'message': f'Error fetching listings: {listings_response.status_code}',
                'details': listings_response.text
            }), 500
            
        listings = listings_response.json()
        
        # Step 2: Fetch bids for each listing and combine the data
        result = []
        
        for listing in listings:
            listing_id = listing['id']
            
            # Fetch bids for this listing
            bids_response = requests.get(f"{BIDDING_SERVICE_URL}/api/bids/listing/{listing_id}")
            bids = []
            
            if bids_response.status_code == 200:
                bids = bids_response.json()
                
                # Transform bids to frontend format
                formatted_bids = []
                for bid in bids:
                    formatted_bid = {
                        'bid_id': bid['id'],
                        'bid_amt': float(bid['amount']),
                        'bidder_id': bid['bidderId'],
                        'bid_time': bid['bidTime'],
                        'status': bid['status']
                    }
                    formatted_bids.append(formatted_bid)
                
                # Sort bids by amount (highest first)
                formatted_bids.sort(key=lambda x: x['bid_amt'], reverse=True)
            
            # Get highest bid
            highest_bid = None
            if formatted_bids:
                highest_bid = formatted_bids[0]
            
            # Fix datetime comparison issue - method 1: Make both naive
            current_time = datetime.now()  # Naive datetime
            
            # Parse the expiry time and make it naive as well
            expiry_time_str = listing['expiryDate']
            if 'Z' in expiry_time_str:
                expiry_time_str = expiry_time_str.replace('Z', '')
                
            try:
                expiry_time = datetime.fromisoformat(expiry_time_str)
            except ValueError:
                # Fallback for different date formats
                try:
                    expiry_time = datetime.strptime(expiry_time_str, "%Y-%m-%dT%H:%M:%S.%f")
                except ValueError:
                    expiry_time = datetime.strptime(expiry_time_str, "%Y-%m-%dT%H:%M:%S")
            
            # Now compare the two naive datetimes
            derived_status = 'active' if expiry_time > current_time else 'ended'
            
            # Create combined listing object with bids
            listing_with_bids = {
                'listing_id': listing['id'],
                'name': listing['title'],
                'description': listing['description'],
                'time_end': listing['expiryDate'],
                'start_bid': float(listing['startingPrice']),
                'status': derived_status,  # Now derived from expiry date
                'organ_id': listing['organId'],
                'owner_id': listing['ownerId'],
                'image': listing.get('image', 'default-organ.jpg'),  # Added image with default
                'current_bid': highest_bid['bid_amt'] if highest_bid else None,
                'highest_bidder': highest_bid['bidder_id'] if highest_bid else None,
                'bids_count': len(formatted_bids),
                'bids': formatted_bids
            }
            
            result.append(listing_with_bids)
        
        # Step 3: Sort listings (active first, then by expiry date)
        result.sort(key=lambda x: (
            0 if x['status'] == 'active' else 1,  # Sort active listings first
            x['time_end']  # Then sort by expiry date
        ))
        
        return jsonify(result)
        
    except requests.RequestException as e:
        app.logger.error(f"Request error: {str(e)}")
        return jsonify({'message': 'Service communication error', 'error': str(e)}), 503
        
    except Exception as e:
        app.logger.error(f"Unexpected error: {str(e)}")
        import traceback
        app.logger.error(traceback.format_exc())
        return jsonify({'message': 'Internal server error', 'error': str(e)}), 500

if __name__ == '__main__':
    print(f"Starting adapter service on port {PORT}")
    app.run(host='0.0.0.0', port=PORT)