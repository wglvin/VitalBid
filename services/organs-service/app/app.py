from flask import Flask
from app.controllers import organs_blueprint

app = Flask(__name__)
app.register_blueprint(organs_blueprint, url_prefix='/organs')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
