#!/bin/bash

echo "========================================"
echo "FactorClaim Desktop App Setup"
echo "========================================"
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    echo
    exit 1
fi

echo "Node.js version:"
node --version
echo

echo "NPM version:"
npm --version
echo

echo "Installing dependencies..."
cd DesktopApp
npm install

if [ $? -ne 0 ]; then
    echo
    echo "ERROR: Failed to install dependencies!"
    echo
    exit 1
fi

echo
echo "Creating .env file..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo ".env file created successfully!"
else
    echo ".env file already exists, skipping..."
fi

echo
echo "========================================"
echo "Setup Complete!"
echo "========================================"
echo
echo "To run the application in development mode:"
echo "  cd DesktopApp"
echo "  npm run electron-dev"
echo
echo "To build for production:"
echo "  cd DesktopApp"
echo "  npm run electron-build"
echo
