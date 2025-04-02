from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os
from pathlib import Path

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Path to data directory
DATA_DIR = Path(__file__).parent / "data"

@app.route("/api/companies", methods=["GET"])
def get_companies():
    """Return list of companies"""
    try:
        with open(DATA_DIR / "companies.json", "r") as file:
            companies = json.load(file)
        return jsonify(companies)
    except FileNotFoundError:
        return jsonify({"error": "Companies data not found"}), 404

@app.route("/api/memory/<company_id>", methods=["GET"])
def get_company_memory(company_id):
    """Return memory data for a specific company"""
    try:
        with open(DATA_DIR / f"memory/{company_id}.json", "r") as file:
            memory = json.load(file)
        return jsonify(memory)
    except FileNotFoundError:
        return jsonify({"error": f"Memory data for company {company_id} not found"}), 404

# Health check endpoint
@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "message": "Mock API is running"})

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000) 