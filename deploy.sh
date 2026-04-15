#!/bin/bash

# Pull latest changes (if using git)
# git pull origin main

# Build and restart containers
docker compose up -d --build

# Clean up old images
docker image prune -f

echo "Deployment finished successfully!"
