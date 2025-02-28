from flask import Blueprint, request, jsonify

organs_blueprint = Blueprint('organs', __name__)

# In-memory store for demonstration purposes
organs_db = {}

@organs_blueprint.route('/', methods=['POST'])
def create_organ():
    data = request.get_json()
    organ_id = data.get("id")
    organ_type = data.get("type")
    if not organ_id or not organ_type:
        return jsonify({"error": "Missing organ data"}), 400

    # Optionally add more details like status or compatibility info
    organs_db[organ_id] = {
        "id": organ_id,
        "type": organ_type,
        "status": data.get("status", "available")
    }
    return jsonify({"message": "Organ created", "organ": organs_db[organ_id]}), 201

@organs_blueprint.route('/<organ_id>', methods=['GET'])
def get_organ(organ_id):
    organ = organs_db.get(organ_id)
    if not organ:
        return jsonify({"error": "Organ not found"}), 404
    return jsonify(organ), 200
