from flask import Flask, request, jsonify
import requests
import os

app = Flask(__name__)

LIST_SERVICE_URL = "http://list-service:5001"
BID_SERVICE_URL = "http://bid-service:5002"

@app.route('/get_listing_bids/<int:listing_id>', methods=['GET'])
def get_listing_bids(listing_id):
    try:
        # Get listing details
        listing_response = requests.get(f"{LIST_SERVICE_URL}/listings/{listing_id}")
        if listing_response.status_code == 404:
            return jsonify({"error": "Listing not found"}), 404
        listing = listing_response.json()

        # Get all bids
        bids_response = requests.get(f"{BID_SERVICE_URL}/bids")
        all_bids = bids_response.json()

        # Filter bids for this listing
        listing_bids = [bid for bid in all_bids if bid['Listing_ID'] == listing_id]

        return jsonify({
            "listing": listing,
            "bids": listing_bids
        })

    except requests.RequestException as e:
        return jsonify({"error": f"Service communication error: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5003)