# ============================================================================
# JT-Orga Production Dockerfile
# Multi-stage build, hardened, non-root, minimal attack surface
# ============================================================================

# Stage 1: Build Frontend (Vite)
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files first (layer caching)
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Remove source files that aren't needed in production
RUN rm -rf src tests .storybook storybook-static

# ============================================================================
# Stage 2: Production Runtime
# ============================================================================
FROM node:22-alpine AS runtime

# Security: Install only essential runtime dependencies
RUN apk add --no-cache \
    curl \
    wget \
    tini \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files for production dependencies only
COPY package*.json ./

# Install production dependencies only (no postinstall scripts)
RUN npm ci --omit=dev --ignore-scripts

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/public ./public

# Copy runtime configuration files
COPY --from=builder /app/vite.config.ts ./vite.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Create data directory for SQLite with proper permissions
RUN mkdir -p /app/data && \
    chmod 750 /app/data

# ============================================================================
# Security Hardening
# ============================================================================

# Create non-root user with specific UID/GID
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# Change ownership of app directory
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose only the application port
EXPOSE 3000

# Environment variables with defaults
ENV NODE_ENV=production
ENV PORT=3000
ENV NODE_OPTIONS="--max-old-space-size=512"

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Use tini as PID 1 for proper signal handling
ENTRYPOINT ["tini", "--"]

# Start application
CMD ["node", "--experimental-strip-types", "server.ts"]
