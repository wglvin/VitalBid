import pika
from flask import Blueprint, request, jsonify

user_blueprint = Blueprint('user', __name__)

# In-memory store
users_db = {}

def get_rabbit_connection():
    """
    Establishes a connection to RabbitMQ.
    In docker-compose, use the service name 'rabbitmq' as host.
    """
    params = pika.ConnectionParameters(host='rabbitmq', port=5672,
                                       credentials=pika.PlainCredentials('admin', 'admin'))
    return pika.BlockingConnection(params)

@user_blueprint.route('/', methods=['POST'])
def create_user():
    data = request.get_json()
    user_id = data.get("id")
    name = data.get("name")
    if not user_id or not name:
        return jsonify({"error": "Missing user data"}), 400

    users_db[user_id] = {"id": user_id, "name": name, "role": data.get("role", "donor")}

    # Publish an event to RabbitMQ
    connection = get_rabbit_connection()
    channel = connection.channel()
    channel.queue_declare(queue='USER_EVENTS', durable=True)

    message = f"UserCreated: {user_id}"
    channel.basic_publish(exchange='',
                          routing_key='USER_EVENTS',
                          body=message,
                          properties=pika.BasicProperties(delivery_mode=2))  # persistent
    connection.close()

    return jsonify({"message": "User created", "user": users_db[user_id]}), 201

@user_blueprint.route('/<user_id>', methods=['GET'])
def get_user(user_id):
    user = users_db.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify(user), 200

def consume_user_events():
    connection = get_rabbit_connection()
    channel = connection.channel()
    channel.queue_declare(queue='USER_EVENTS', durable=True)

    def callback(ch, method, properties, body):
        print("Received message:", body.decode())
        ch.basic_ack(delivery_tag=method.delivery_tag)

    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue='USER_EVENTS', on_message_callback=callback, auto_ack=False)
    print(" [*] Waiting for messages in USER_EVENTS. To exit press CTRL+C")
    channel.start_consuming()
