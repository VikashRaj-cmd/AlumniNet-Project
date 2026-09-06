# ─── STAGE 1: Build Dependencies ────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# ─── STAGE 2: Production Runtime ───────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Create non-root user app group/user if needed (alpine node image comes with 'node' user)
# Ensure uploads directory exists and is owned by node user
RUN mkdir -p uploads && chown -R node:node /app

# Copy dependencies from builder
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

# Copy application source code
COPY . .

# Change owner of copied files to non-root node user
USER node

# Expose server port
EXPOSE 5000

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start production server
CMD ["node", "server.js"]
