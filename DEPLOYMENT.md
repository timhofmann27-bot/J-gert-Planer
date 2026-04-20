# JT-Orga Deployment Guide

## Quick Start

```bash
# 1. Clone repository
git clone https://github.com/your-username/JT-Orga.git
cd JT-Orga

# 2. Setup environment
./setup.sh

# 3. Configure domain (edit Caddyfile)
nano Caddyfile

# 4. Deploy
./deploy.sh
```

## Prerequisites

- Docker 24+
- Docker Compose v2+
- Domain name with DNS configured
- Server with 1GB+ RAM, 10GB+ disk

## Deployment Steps

### 1. Initial Setup

```bash
# Generate secure secrets
openssl rand -hex 32  # For JWT_SECRET
openssl rand -base64 16  # For ADMIN_PASSWORD

# Create .env file
cp .env.production.example .env
nano .env  # Fill in your values
```

### 2. Configure Domain

Edit `Caddyfile` and replace `example.com` with your domain:

```bash
nano Caddyfile
```

### 3. Deploy

```bash
./deploy.sh
```

### 4. Verify

```bash
# Check container status
docker compose ps

# Check logs
docker compose logs -f jt-orga

# Test health endpoint
curl https://your-domain.com/api/health
```

## Backup & Restore

### Automated Backup

```bash
# Run backup script
./backup.sh

# Backups are stored in /opt/jt-orga-backups/
```

### Manual Database Backup

```bash
# Copy database file
cp data/data.db backup/data_$(date +%Y%m%d).db

# Or use SQLite backup command
sqlite3 data/data.db ".backup 'backup/data_$(date +%Y%m%d).db'"
```

### Restore from Backup

```bash
# Stop application
docker compose down

# Restore database
gunzip /opt/jt-orga-backups/data_YYYYMMDD_HHMMSS.db.gz
sqlite3 data/data.db ".restore 'backup/data_YYYYMMDD_HHMMSS.db'"

# Start application
docker compose up -d
```

## Monitoring

### Health Checks

- **Basic**: `GET /api/health` - Returns OK
- **Readiness**: `GET /api/health/ready` - Checks database connection
- **Liveness**: `GET /api/health/live` - Process alive check

### Logs

```bash
# Application logs
docker compose logs jt-orga

# Caddy logs
docker compose logs caddy

# All logs
docker compose logs -f
```

## Rollback

### Automatic Rollback (on failed deployment)

The `deploy.sh` script will automatically rollback if health checks fail.

### Manual Rollback

```bash
# Rollback to previous version
./deploy.sh --rollback

# Or manually
docker compose down
git checkout HEAD~1
docker compose up -d
```

## Troubleshooting

### Application won't start

```bash
# Check logs
docker compose logs jt-orga

# Check if port is in use
netstat -tlnp | grep 3000

# Check environment variables
docker compose config
```

### Database issues

```bash
# Check database file permissions
ls -la data/

# Verify database integrity
sqlite3 data/data.db "PRAGMA integrity_check;"

# Check database size
du -h data/data.db
```

### SSL/TLS issues

```bash
# Check Caddy logs
docker compose logs caddy

# Verify certificate
curl -vI https://your-domain.com

# Force certificate renewal
docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile
```

## Security Checklist

- [ ] `.env` file is in `.gitignore`
- [ ] Secrets are not hardcoded
- [ ] HTTPS is enabled (via Caddy)
- [ ] Security headers are configured
- [ ] Rate limiting is active
- [ ] Backup is working
- [ ] Health checks are responding
- [ ] Logs are being collected
- [ ] Firewall is configured (only 80, 443, 22)
- [ ] SSH key authentication is enabled

## Production Checklist

Before going live:

1. **Domain Configuration**
   - [ ] Domain points to server IP
   - [ ] SSL certificate is auto-provisioning
   - [ ] DNS propagation is complete

2. **Security**
   - [ ] JWT_SECRET is secure (64 hex chars)
   - [ ] ADMIN_PASSWORD is secure
   - [ ] .env is not in version control
   - [ ] Firewall allows only 80, 443, 22

3. **Performance**
   - [ ] Server has 1GB+ RAM
   - [ ] Database backups are automated
   - [ ] Log rotation is configured
   - [ ] Monitoring is set up

4. **Documentation**
   - [ ] Deployment procedure is documented
   - [ ] Rollback procedure is documented
   - [ ] Emergency contacts are listed
   - [ ] Backup verification schedule is set

## Contact

For deployment issues, check:
1. Application logs: `docker compose logs jt-orga`
2. Health endpoint: `curl https://your-domain.com/api/health`
3. GitHub Issues: [https://github.com/your-username/JT-Orga/issues](https://github.com/your-username/JT-Orga/issues)
