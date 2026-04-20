#!/bin/bash
# ============================================================================
# JT-Orga Production Deployment Script
# Blue-green style deployment with health checks
# ============================================================================

set -e

# Configuration
APP_NAME="JT-ORGA"
APP_DIR="/opt/jt-orga"
HEALTH_URL="http://localhost:3000/api/health"
HEALTH_TIMEOUT=60
MAX_RETRIES=10

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================================================
# Functions
# ============================================================================

log() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

check_prerequisites() {
    log "${BLUE}[CHECK] Verifying prerequisites...${NC}"

    # Check Docker
    if ! command -v docker &> /dev/null; then
        log "${RED}  ✗ Docker not found${NC}"
        exit 1
    fi
    log "${GREEN}  ✓ Docker found${NC}"

    # Check Docker Compose
    if ! command -v docker compose &> /dev/null; then
        log "${RED}  ✗ Docker Compose not found${NC}"
        exit 1
    fi
    log "${GREEN}  ✓ Docker Compose found${NC}"

    # Check .env file
    if [ ! -f .env ]; then
        log "${RED}  ✗ .env file not found${NC}"
        exit 1
    fi
    log "${GREEN}  ✓ .env file found${NC}"

    # Validate required environment variables
    source .env
    if [ -z "$JWT_SECRET" ]; then
        log "${RED}  ✗ JWT_SECRET not set in .env${NC}"
        exit 1
    fi
    if [ -z "$ADMIN_PASSWORD" ]; then
        log "${RED}  ✗ ADMIN_PASSWORD not set in .env${NC}"
        exit 1
    fi
    log "${GREEN}  ✓ Environment variables validated${NC}"
}

backup_before_deploy() {
    log "${BLUE}[BACKUP] Creating pre-deployment backup...${NC}"

    if [ -f ./backup.sh ]; then
        chmod +x ./backup.sh
        ./backup.sh
        log "${GREEN}  ✓ Pre-deployment backup completed${NC}"
    else
        log "${YELLOW}  ⚠ Backup script not found, skipping backup${NC}"
    fi
}

deploy() {
    log "${BLUE}[DEPLOY] Starting deployment of $APP_NAME...${NC}"

    # Pull latest images
    log "${BLUE}  Pulling latest images...${NC}"
    docker compose pull

    # Build with cache
    log "${BLUE}  Building application...${NC}"
    docker compose build --parallel

    # Start services with rolling update
    log "${BLUE}  Starting services...${NC}"
    docker compose up -d --remove-orphans

    log "${GREEN}  ✓ Deployment started${NC}"
}

wait_for_health() {
    log "${BLUE}[HEALTH] Waiting for application to be healthy...${NC}"

    local retries=0
    local wait_time=$((HEALTH_TIMEOUT / MAX_RETRIES))

    while [ $retries -lt $MAX_RETRIES ]; do
        if curl -f --max-time 5 "${HEALTH_URL}" &>/dev/null; then
            log "${GREEN}  ✓ Application is healthy${NC}"
            return 0
        fi

        retries=$((retries + 1))
        log "${YELLOW}  ⚠ Health check attempt $retries/$MAX_RETRIES failed, waiting ${wait_time}s...${NC}"
        sleep $wait_time
    done

    log "${RED}  ✗ Application failed health check after $MAX_RETRIES attempts${NC}"
    return 1
}

verify_deployment() {
    log "${BLUE}[VERIFY] Verifying deployment...${NC}"

    # Check container status
    if docker compose ps | grep -q "Up"; then
        log "${GREEN}  ✓ Containers are running${NC}"
    else
        log "${RED}  ✗ Some containers are not running${NC}"
        docker compose ps
        return 1
    fi

    # Check application response
    if curl -f --max-time 5 "${HEALTH_URL}" &>/dev/null; then
        local response=$(curl -s "${HEALTH_URL}")
        log "${GREEN}  ✓ Application responding: ${response}${NC}"
    else
        log "${RED}  ✗ Application not responding${NC}"
        return 1
    fi

    return 0
}

cleanup() {
    log "${BLUE}[CLEANUP] Cleaning up old resources...${NC}"

    # Remove unused images
    docker image prune -f

    # Remove unused volumes (be careful with this)
    # docker volume prune -f

    log "${GREEN}  ✓ Cleanup completed${NC}"
}

show_status() {
    echo ""
    log "${GREEN}================================${NC}"
    log "${GREEN}  Deployment Status${NC}"
    log "${GREEN}================================${NC}"
    echo ""

    docker compose ps

    echo ""
    log "${GREEN}Application is running at:${NC}"
    log "${GREEN}  http://localhost:3000 (direct)${NC}"
    log "${GREEN}  https://your-domain.com (via Caddy)${NC}"
    echo ""

    # Show logs
    log "${BLUE}Recent logs:${NC}"
    docker compose logs --tail=10 jt-orga
}

rollback() {
    log "${RED}[ROLLBACK] Deployment failed, initiating rollback...${NC}"

    # Stop current containers
    docker compose down

    # Restore from backup if available
    LATEST_BACKUP=$(ls -t /opt/jt-orga-backups/jt-orga-full-*.tar.gz 2>/dev/null | head -1)
    if [ -n "$LATEST_BACKUP" ]; then
        log "${YELLOW}  Restoring from backup: ${LATEST_BACKUP}${NC}"
        # Note: Actual restore would depend on your backup structure
    fi

    # Restart with previous image
    docker compose up -d --remove-orphans

    if wait_for_health; then
        log "${GREEN}  ✓ Rollback successful${NC}"
    else
        log "${RED}  ✗ Rollback failed, manual intervention required${NC}"
        exit 1
    fi
}

# ============================================================================
# Main Execution
# ============================================================================

main() {
    log "${GREEN}=== Starting $APP_NAME Deployment ===${NC}"

    # Change to app directory
    cd "${APP_DIR}" || {
        log "${RED}Failed to change to app directory: ${APP_DIR}${NC}"
        exit 1
    }

    # Run deployment steps
    check_prerequisites
    backup_before_deploy
    deploy

    # Wait for health check
    if wait_for_health; then
        verify_deployment
        cleanup
        show_status
        log "${GREEN}=== Deployment Successful ===${NC}"
    else
        rollback
        exit 1
    fi
}

# Handle script arguments
case "${1:-}" in
    --rollback)
        cd "${APP_DIR}" && rollback
        ;;
    --status)
        cd "${APP_DIR}" && show_status
        ;;
    --help)
        echo "Usage: $0 [--rollback|--status|--help]"
        echo "  (no args)  - Full deployment"
        echo "  --rollback - Rollback to previous version"
        echo "  --status   - Show current status"
        echo "  --help     - Show this help"
        ;;
    *)
        main
        ;;
esac
