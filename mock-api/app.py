from flask import Flask, jsonify, send_file
from flask_cors import CORS
import os
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Load company data
def load_company_data(company_id):
    try:
        with open(f'data/memory/{company_id}.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return None
    except json.JSONDecodeError:
        return None

# Health check endpoint
@app.route('/health')
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat()
    })

# Get list of companies
@app.route('/api/companies')
def get_companies():
    companies = [
        {
            'id': '1',
            'name': 'Acme Corporation',
            'industry': 'Technology',
            'revenue': '500M',
            'employeeCount': 5000
        },
        {
            'id': '2',
            'name': 'Globex Industries',
            'industry': 'Manufacturing',
            'revenue': '1.2B',
            'employeeCount': 12000
        },
        {
            'id': '3',
            'name': 'Stark Enterprises',
            'industry': 'Defense',
            'revenue': '2.5B',
            'employeeCount': 25000
        },
        {
            'id': '4',
            'name': 'Initech',
            'industry': 'Software',
            'revenue': '800M',
            'employeeCount': 8000
        },
        {
            'id': '5',
            'name': 'Wayne Enterprises',
            'industry': 'Technology',
            'revenue': '3B',
            'employeeCount': 30000
        }
    ]
    return jsonify(companies)

# Get company memory
@app.route('/api/memory/<company_id>')
def get_company_memory(company_id):
    # Validate company ID format
    if not company_id.isdigit():
        return jsonify({
            'error': 'Invalid company ID format. Must be a number.'
        }), 400

    # Load company data
    company_data = load_company_data(company_id)
    
    if company_data is None:
        return jsonify({
            'error': f'Company with ID {company_id} not found'
        }), 404

    return jsonify(company_data)

# Generate PDF form
@app.route('/api/generate-form/<company_id>')
def generate_form(company_id):
    # Validate company ID format
    if not company_id.isdigit():
        return jsonify({
            'error': 'Invalid company ID format. Must be a number.'
        }), 400

    # Load company data
    company_data = load_company_data(company_id)
    
    if company_data is None:
        return jsonify({
            'error': f'Company with ID {company_id} not found'
        }), 404

    # In a real implementation, this would generate a PDF
    # For now, we'll just return a success message
    return jsonify({
        'message': 'Form generated successfully',
        'companyId': company_id
    })

if __name__ == '__main__':
    # Ensure data directory exists
    os.makedirs('data/memory', exist_ok=True)
    
    # Start the server
    app.run(host='0.0.0.0', port=4000, debug=True) 