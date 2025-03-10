import os
import json
import requests
from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.exceptions import NotFound, BadRequest, InternalServerError

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure service URLs from environment variables
LISTING_SERVICE_URL = os.environ.get('LISTING_SERVICE_URL', 'http://listing-service:3001')
BIDDING_SERVICE_URL = os.environ.get('BIDDING_SERVICE_URL', 'http://bidding-service:3002')
PORT = int(os.environ.get('PORT', 3003))

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for the service."""
    return jsonify({
        'status': 'ok',
        'service': 'view-listing-bids-service'
    })

@app.route('/api/listing-bids/<listing_id>', methods=['GET'])
def get_listing_with_bids(listing_id):
    """
    Fetch a listing and all its bids, combining data from both services.
    
    Args:
        listing_id: UUID of the listing to fetch
        
    Returns:
        JSON response with combined listing and bid data
    """
    try:
        # Step 1: Fetch listing details from the listing service
        listing_response = requests.get(f"{LISTING_SERVICE_URL}/api/listings/{listing_id}")
        
        if listing_response.status_code == 404:
            return jsonify({'message': 'Listing not found'}), 404
            
        if listing_response.status_code != 200:
            return jsonify({
                'message': f'Error fetching listing: {listing_response.status_code}',
                'details': listing_response.text
            }), 500
        
        listing = listing_response.json()
        
        # Step 2: Fetch all bids for this listing from the bidding service
        bids_response = requests.get(f"{BIDDING_SERVICE_URL}/api/bids/listing/{listing_id}")
        
        if bids_response.status_code != 200:
            return jsonify({
                'message': f'Error fetching bids: {bids_response.status_code}',
                'details': bids_response.text
            }), 500
            
        bids = bids_response.json()
        
        # Step 3: Get the highest bid information
        highest_bid_response = requests.get(f"{BIDDING_SERVICE_URL}/api/bids/highest/{listing_id}")
        highest_bid = None
        
        if highest_bid_response.status_code == 200:
            highest_bid_data = highest_bid_response.json()
            if 'highestBid' in highest_bid_data:
                highest_bid = highest_bid_data['highestBid']
        
        # Step 4: Combine the listing and bids data
        result = {
            'listing': listing,
            'bids': bids,
            'highest_bid': highest_bid,
            'bid_count': len(bids),
            'bid_stats': calculate_bid_stats(bids) if bids else None
        }
        
        return jsonify(result)
        
    except requests.RequestException as e:
        app.logger.error(f"Request error: {str(e)}")
        return jsonify({'message': 'Service communication error', 'error': str(e)}), 503
        
    except Exception as e:
        app.logger.error(f"Unexpected error: {str(e)}")
        return jsonify({'message': 'Internal server error', 'error': str(e)}), 500

@app.route('/api/listings-with-bids', methods=['GET'])
def get_listings_with_bids():
    """
    Fetch all listings and include bid count and highest bid for each.
    
    Query Parameters:
        status: Filter by listing status (optional)
        organ_type: Filter by organ type (optional)
        
    Returns:
        JSON response with combined listing and summarized bid data
    """
    try:
        # Get query parameters
        status = request.args.get('status')
        organ_type = request.args.get('organ_type')
        
        # Build the query string for the listing service
        query_params = {}
        if status:
            query_params['status'] = status
        if organ_type:
            query_params['organType'] = organ_type
            
        # Step 1: Fetch all listings from the listing service
        listings_response = requests.get(
            f"{LISTING_SERVICE_URL}/api/listings",
            params=query_params
        )
        
        if listings_response.status_code != 200:
            return jsonify({
                'message': f'Error fetching listings: {listings_response.status_code}',
                'details': listings_response.text
            }), 500
            
        listings = listings_response.json()
        
        # Step 2: For each listing, get bid summary information
        enhanced_listings = []
        
        for listing in listings:
            listing_id = listing['id']
            
            # Get highest bid for this listing
            highest_bid_response = requests.get(f"{BIDDING_SERVICE_URL}/api/bids/highest/{listing_id}")
            highest_bid = None
            
            if highest_bid_response.status_code == 200:
                highest_bid_data = highest_bid_response.json()
                if 'highestBid' in highest_bid_data:
                    highest_bid = highest_bid_data['highestBid']
            
            # Get bid count for this listing
            bids_response = requests.get(f"{BIDDING_SERVICE_URL}/api/bids/listing/{listing_id}")
            bid_count = 0
            
            if bids_response.status_code == 200:
                bids = bids_response.json()
                bid_count = len(bids)
            
            # Enhance the listing with bid information
            enhanced_listing = {
                **listing,
                'bid_count': bid_count,
                'highest_bid': highest_bid
            }
            
            enhanced_listings.append(enhanced_listing)
        
        return jsonify(enhanced_listings)
        
    except requests.RequestException as e:
        app.logger.error(f"Request error: {str(e)}")
        return jsonify({'message': 'Service communication error', 'error': str(e)}), 503
        
    except Exception as e:
        app.logger.error(f"Unexpected error: {str(e)}")
        return jsonify({'message': 'Internal server error', 'error': str(e)}), 500

@app.route('/api/organ-stats', methods=['GET'])
def get_organ_stats():
    """
    Get statistics about organs, listings, and bids.
    
    Returns:
        JSON response with statistics about the system
    """
    try:
        # Step 1: Get all organs
        organs_response = requests.get(f"{LISTING_SERVICE_URL}/api/organs")
        
        if organs_response.status_code != 200:
            return jsonify({
                'message': f'Error fetching organs: {organs_response.status_code}',
                'details': organs_response.text
            }), 500
            
        organs = organs_response.json()
        
        # Step 2: Get all listings
        listings_response = requests.get(f"{LISTING_SERVICE_URL}/api/listings")
        
        if listings_response.status_code != 200:
            return jsonify({
                'message': f'Error fetching listings: {listings_response.status_code}',
                'details': listings_response.text
            }), 500
            
        listings = listings_response.json()
        
        # Step 3: Calculate statistics
        organ_stats = {}
        
        for organ in organs:
            organ_id = organ['id']
            organ_type = organ['type']
            
            # Find all listings for this organ
            organ_listings = [l for l in listings if l.get('organId') == organ_id]
            
            # Calculate statistics
            organ_stats[organ_type] = {
                'total_listings': len(organ_listings),
                'active_listings': len([l for l in organ_listings if l.get('status') == 'active']),
                'completed_listings': len([l for l in organ_listings if l.get('status') == 'completed']),
                'cancelled_listings': len([l for l in organ_listings if l.get('status') == 'cancelled']),
                'avg_starting_price': calculate_avg_price(organ_listings, 'startingPrice'),
                'highest_starting_price': calculate_max_price(organ_listings, 'startingPrice'),
                'lowest_starting_price': calculate_min_price(organ_listings, 'startingPrice')
            }
        
        # Overall statistics
        total_stats = {
            'total_organs': len(organs),
            'total_listings': len(listings),
            'active_listings': len([l for l in listings if l.get('status') == 'active']),
            'completed_listings': len([l for l in listings if l.get('status') == 'completed']),
            'cancelled_listings': len([l for l in listings if l.get('status') == 'cancelled'])
        }
        
        result = {
            'overall_stats': total_stats,
            'organ_stats': organ_stats
        }
        
        return jsonify(result)
        
    except requests.RequestException as e:
        app.logger.error(f"Request error: {str(e)}")
        return jsonify({'message': 'Service communication error', 'error': str(e)}), 503
        
    except Exception as e:
        app.logger.error(f"Unexpected error: {str(e)}")
        return jsonify({'message': 'Internal server error', 'error': str(e)}), 500

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

def calculate_avg_price(listings, price_field):
    """Calculate average price from a list of listings."""
    if not listings:
        return 0
    
    prices = [float(listing.get(price_field, 0)) for listing in listings]
    return sum(prices) / len(prices) if prices else 0

def calculate_max_price(listings, price_field):
    """Find maximum price from a list of listings."""
    if not listings:
        return 0
    
    prices = [float(listing.get(price_field, 0)) for listing in listings]
    return max(prices) if prices else 0

def calculate_min_price(listings, price_field):
    """Find minimum price from a list of listings."""
    if not listings:
        return 0
    
    prices = [float(listing.get(price_field, 0)) for listing in listings]
    return min(prices) if prices else 0

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'message': 'Resource not found'}), 404

@app.errorhandler(400)
def bad_request(error):
    return jsonify({'message': 'Bad request', 'error': str(error)}), 400

@app.errorhandler(500)
def server_error(error):
    return jsonify({'message': 'Internal server error', 'error': str(error)}), 500

if __name__ == '__main__':
    print(f"Starting view-listing-bids service on port {PORT}")
    # In production, you might want to use gunicorn instead
    app.run(host='0.0.0.0', port=PORT)