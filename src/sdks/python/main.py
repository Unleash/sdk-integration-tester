from cgitb import enable
from flask import Flask, jsonify, make_response, request
from UnleashClient import UnleashClient
from typing import *
from os import getenv

app = Flask(__name__)

API_KEY = getenv("UNLEASH_API_TOKEN")
API_URL = getenv("UNLEASH_URL")
port = getenv("PORT") or "5001"

client = UnleashClient(
    url=API_URL,
    app_name="python-test-server",
    custom_headers={"Authorization": API_KEY},
    refresh_interval = 1
)

client.initialize_client()


@app.route("/")
@app.route("/ready")
def respond_ok():
    return make_response(
        jsonify({"status": "ok"}),
        200,
    )


@app.route("/is-enabled", methods=["POST"])
def is_enabled():
    toggle = request.json.get("toggle")
    context = request.json.get("context")
    return make_response(
        jsonify(
            {
                "name": toggle,
                "enabled": client.is_enabled(toggle, context),
                "context": context,
            }
        ),
        200,
    )

@app.route("/variant", methods=["POST"])
def get_variant():
    toggle = request.json.get("toggle")
    context = request.json.get("context")
    return make_response(
        jsonify(
            {
                "name": toggle,
                "enabled": client.get_variant(toggle, context),
                "context": context,
            }
        ),
        200,
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=port)
