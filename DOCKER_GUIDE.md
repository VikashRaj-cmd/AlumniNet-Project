# AlumniNet — Docker Containerization Guide

This guide explains how to build, run, and manage the AlumniNet application using Docker and Docker Compose.

---

## Container Architecture

AlumniNet uses a microservice-style containerized architecture managed via Docker Compose:

| Service | Technology | Internal Port | Exposed Port | Purpose |
|---------|------------|---------------|--------------|---------|
| **frontend** | React 18 + Vite + Nginx | `80` | `3000` (Prod) / `5173` (Dev) | SPA client served via Nginx with API proxy |
| **backend** | Node.js 20 + Express | `5000` | `5000` | REST API + Socket.io Server |
| **mongo** | MongoDB 7.0 | `27017` | `27017` | NoSQL Database |
| **redis** | Redis 7 Alpine | `6379` | `6379` | In-memory cache & online session store |

---

## Quick Start (Production Mode)

To launch the complete production stack (Frontend, Backend, MongoDB, Redis):

```powershell
# 1. Clone & Navigate to project root
cd e:\AlumniNet

# 2. Build and start all services in detached mode
docker-compose up -d --build

# 3. Check status of running containers
docker-compose ps
```

Access points:
- **Frontend App:** http://localhost:3000
- **Backend API Health Check:** http://localhost:5000/api/health
- **MongoDB:** `localhost:27017`
- **Redis:** `localhost:6379`

---

## Development Mode (Hot-Reloading)

To run the development stack with code hot-reloading:

```powershell
docker-compose -f docker-compose.dev.yml up -d --build
```

Access points in Dev Mode:
- **Frontend Vite Dev:** http://localhost:5173
- **Backend Express Dev:** http://localhost:5000

---

## Useful Operations & Commands

### View Logs
```powershell
# View logs for all services
docker-compose logs -f

# View logs for backend only
docker-compose logs -f backend

# View logs for frontend only
docker-compose logs -f frontend
```

### Stop Services
```powershell
# Stop containers (preserves DB data volumes)
docker-compose down

# Stop containers and remove persistent volumes
docker-compose down -v
```

### Seed Database inside Docker
```powershell
docker-compose exec backend node seed.js
```

### Check Container Health
```powershell
docker inspect --format='{{json .State.Health}}' alumninet-backend
```

---

## Environment Variables in Docker

The production `docker-compose.yml` uses the following defaults:
- `MONGODB_URI`: `mongodb://mongo:27017/alumninet`
- `REDIS_URL`: `redis://redis:6379`
- `JWT_SECRET`: `alumninet_super_secret_jwt_key_2026_prod`

To customize credentials, create a `.env` file in the root directory. Docker Compose will automatically inject variables from `.env`.
