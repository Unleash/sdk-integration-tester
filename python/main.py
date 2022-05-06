from cgitb import enable
from flask import Flask, jsonify, make_response, request
from UnleashClient import UnleashClient
from typing import *

app = Flask(__name__)

API_KEY = "test-server:default.8a090f30679be7254af997864d66b86e44dcfc5291916adff72a0fb5"
API_URL = "https://app.unleash-hosted.com/demo/api"


client = UnleashClient(
    url=API_URL,
    app_name="python-test-server",
    custom_headers={"Authorization": API_KEY},
)

client.initialize_client()


@app.route("/")
@app.route("/ready")
def respond_ok():
    return make_response(
        jsonify({"status": "ok"}),
        200,
    )


@app.route("/is-enabled/<string:toggle_name>")
def is_enabled(toggle_name: str):
    context = request.args.to_dict()
    return make_response(
        jsonify(
            {
                "name": toggle_name,
                "enabled": client.is_enabled(toggle_name, context),
                "context": context,
            }
        ),
        200,
    )


@app.route("/variant/<toggle_name>")
def get_variant(toggle_name):
    context = request.args.to_dict()
    return make_response(
        jsonify(
            {
                "name": toggle_name,
                "variant": client.get_variant(toggle_name, context),
                "context": context,
            }
        ),
        200,
    )


if __name__ == "__main__":
    app.run()
