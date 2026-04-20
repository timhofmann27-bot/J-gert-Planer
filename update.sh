#!/bin/bash
# ============================================================================
# JT-Orga Update Script
# Quick update with minimal downtime
# ============================================================================

set -e

APP_DIR="/opt/jt-orga"
APP_NAME="JT-ORGA"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Starting $APP_NAME Update ===${NC}"

# Change to app directory
cd "${APP_DIR}" || {
    echo -e "${RED}Failed to change to app directory: ${APP_DIR}${NC}"
    exit 1
}

# 1. Create backup before update
echo -e "${YELLOW}[1/4] Creating backup...${NC}"
if [ -f ./backup.sh ]; then
    chmod +x ./backup.sh
    ./backup.sh
    echo -e "${GREEN}  ✓ Backup completed${NC}"
else
    echo -e "${YELLOW}  ⚠ Backup script not found, skipping backup${NC}"
fi

# 2. Pull latest changes
echo -e "${YELLOW}[2/4] Pulling latest changes...${NC}"
git pull origin main
echo -e "${GREEN}  ✓ Code updated${NC}"

# 3. Rebuild and restart containers
echo -e "${YELLOW}[3/4] Rebuilding containers...${NC}"
docker compose pull
docker compose up -d --build --remove-orphans
echo -e "${GREEN}  ✓ Containers rebuilt and started${NC}"

# 4. Verify and cleanup
echo -e "${YELLOW}[4/4] Verifying deployment...${NC}"

# Wait for health check
echo "Waiting for health check..."
for i in {1..10}; do
    if curl -f http://localhost:3000/api/health &>/dev/null; then
        echo -e "${GREEN}  ✓ Health check passed${NC}"
        break
    fi
    echo -e "${YELLOW}  ⚠ Health check attempt $i/10 failed, waiting...${NC}"
    sleep 5
done

# Clean up old images
docker image prune -f
echo -e "${GREEN}  ✓ Cleanup completed${NC}"

# Show status
echo ""
echo -e "${GREEN}=== Update Complete ===${NC}"
docker compose ps
echo ""
echo -e "${GREEN}Application is running at:${NC}"
echo -e "${GREEN}  http://localhost:3000${NC}"
echo ""
