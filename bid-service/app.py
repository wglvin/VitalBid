from flask import Flask, request, jsonify
import os
import mysql.connector
import time
from mysql.connector import Error

app = Flask(__name__)

def get_db_connection(max_retries=5, delay_seconds=5):
    for attempt in range(max_retries):
        try:
            return mysql.connector.connect(
                host=os.getenv("MYSQL_HOST", "mysql"),
                user=os.getenv("MYSQL_USER", "root"),
                password=os.getenv("MYSQL_ROOT_PASSWORD", "password"),
                database=os.getenv("MYSQL_DATABASE", "organ_marketplace")
            )
        except Error as err:
            if attempt == max_retries - 1:
                raise
            print(f"Connection attempt {attempt + 1} failed, retrying in {delay_seconds} seconds...")
            time.sleep(delay_seconds)

db = get_db_connection()

@app.route('/bid', methods=['POST'])
def create_bid():
    data = request.get_json()
    if 'listing_id' not in data or 'bid_amount' not in data:
        return jsonify({"error": "Missing required fields"}), 400
    
    listing_id = data['listing_id']
    bid_amount = data['bid_amount']
    
    try:
        cursor = db.cursor()
        cursor.execute(
            "INSERT INTO Bid (Listing_ID, Time_Placed, Bid_Amt) VALUES (%s, NOW(), %s)", 
            (listing_id, bid_amount)
        )
        db.commit()
        new_id = cursor.lastrowid
        cursor.close()
        return jsonify({"id": new_id, "message": "Bid created successfully"}), 201
    except Error as err:
        return jsonify({"error": str(err)}), 400

@app.route('/bids', methods=['GET'])
def get_bids():
    try:
        cursor = db.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Bid")
        bids = cursor.fetchall()
        cursor.close()
        db.close()
        return jsonify(bids)
    except Error as err:
        return jsonify({"error": str(err)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002)  

