# Mock API for Harper Form Generator

This is a simple Flask application that provides mock API endpoints for company data and memory retrieval, simulating the external APIs used by the Harper Form Generator application.

## Setup

1. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

2. Activate the virtual environment:
   ```bash
   # On Windows
   venv\Scripts\activate
   
   # On macOS/Linux
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running the API

Start the Flask development server:
```bash
python app.py
```

The API will be available at `http://localhost:5000`.

## Available Endpoints

### Get All Companies
```
GET /api/companies
```

Returns a list of all available companies.

### Get Company Memory
```
GET /api/memory/:company_id
```

Returns structured company data and unstructured call transcript data for the specified company.

### Health Check
```
GET /health
```

Returns a simple health check response to verify the API is running.

## Data Structure

### Companies

The companies data is structured as follows:
```json
{
  "companies": [
    {
      "id": "1",
      "name": "Acme Corporation",
      "industry": "Manufacturing",
      "size": "Medium"
    },
    ...
  ]
}
```

### Company Memory

Each company's memory data is structured as follows:
```json
{
  "structured": {
    "companyName": "Company Name",
    "industry": "Industry",
    "yearFounded": 1985,
    "revenue": "$XXM",
    "employeeCount": 250,
    "location": {
      "headquarters": "City, State",
      "facilities": [
        "City1, State1",
        "City2, State2"
      ]
    },
    "contactInfo": {
      "primaryContact": "Contact Name",
      "position": "Position",
      "phone": "XXX-XXX-XXXX",
      "email": "email@example.com"
    }
  },
  "unstructured": [
    {
      "type": "transcript",
      "date": "YYYY-MM-DD",
      "content": "Transcript content..."
    },
    ...
  ]
}
```

## Integrating with the Main Application

To integrate this mock API with the Harper Form Generator application, update the API endpoints in the main application to point to these mock endpoints:

- Companies API: `http://localhost:5000/api/companies`
- Memory API: `http://localhost:5000/api/memory/:company_id`

## Customizing Mock Data

You can modify the mock data by editing the JSON files in the `data` directory:

- `data/companies.json`: List of companies
- `data/memory/1.json`, `data/memory/2.json`, etc.: Memory data for each company 