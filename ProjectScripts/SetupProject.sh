#!/bin/bash

# Install system dependencies
sudo apt-get update
sudo apt-get install -y \
    build-essential \
    libssl-dev \
    libffi-dev \
    python3-dev \
    redis-server \
    postgresql \
    postgresql-contrib

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Create project directories
mkdir -p Server/{src/{config,controllers,middleware,routes,services,utils},dist}

# Initialize Node.js project
cd Server
npm init -y

# Install dependencies
npm install express pg playwright redis bullmq dotenv winston
npm install --save-dev typescript @types/node @types/express ts-node nodemon

# Initialize TypeScript
npx tsc --init

# Create .env file
cat <<EOT > .env
DB_HOST=localhost
DB_PORT=5432
DB_USER=user
DB_PASSWORD=password
DB_NAME=web_scraper
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3000
EOT

# Set up PostgreSQL
sudo -u postgres psql -c "CREATE DATABASE web_scraper;"
sudo -u postgres psql -c "CREATE USER user WITH PASSWORD 'password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE web_scraper TO user;"

# Start Redis
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Create database schema
psql -U user -d web_scraper -f src/schemas/migration_001.sql

# Set permissions
chmod +x ../ProjectScripts/SetupProject.sh

echo "Setup complete! Run 'npm run dev' to start the server."
