#!/bin/bash

# Create Python virtual environment
echo "Creating Python virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install

echo "Setup complete! To start the mock API server:"
echo "1. Activate the virtual environment: source venv/bin/activate"
echo "2. Start the server: npm start"
echo "3. In another terminal, run tests: npm test" 