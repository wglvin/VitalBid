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

@app.route('/listings', methods=['GET'])
def get_listings():
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM Listing")
    listings = cursor.fetchall()
    cursor.close()
    db.close()
    return jsonify(listings)

@app.route('/listings/<int:listing_id>', methods=['GET'])
def get_listing(listing_id):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM Listing WHERE Listing_ID = %s", (listing_id,))
    listing = cursor.fetchone()
    cursor.close()
    db.close()
    if not listing:
        return jsonify({"error": "Listing not found"}), 404
    return jsonify(listing)

@app.route('/listings', methods=['POST'])
def create_listing():
    data = request.get_json()
    required_fields = ['Name', 'Time_End', 'Start_Bid', 'Bid_Inc', 'Status', 'Type_ID']
    
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400
    
    db = get_db_connection()
    cursor = db.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO Listing (Name, Time_End, Start_Bid, Bid_Inc, Status, Type_ID)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (data['Name'], data['Time_End'], data['Start_Bid'], 
              data['Bid_Inc'], data['Status'], data['Type_ID']))
        db.commit()
        new_id = cursor.lastrowid
        cursor.close()
        db.close()
        return jsonify({"id": new_id, "message": "Listing created successfully"}), 201
    except Error as err:
        return jsonify({"error": str(err)}), 400

@app.route('/organ-types', methods=['POST'])
def create_organ_type():
    data = request.get_json()
    if 'Name' not in data:
        return jsonify({"error": "Name is required"}), 400
    
    db = get_db_connection()
    cursor = db.cursor()
    
    try:
        cursor.execute("INSERT INTO OrganType (Name) VALUES (%s)", (data['Name'],))
        db.commit()
        new_id = cursor.lastrowid
        cursor.close()
        db.close()
        return jsonify({"id": new_id, "message": "Organ type created successfully"}), 201
    except Error as err:
        return jsonify({"error": str(err)}), 400

@app.route('/organ-types', methods=['GET'])
def get_organ_types():
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM OrganType")
    types = cursor.fetchall()
    cursor.close()
    db.close()
    return jsonify(types)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
