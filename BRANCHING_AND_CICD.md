# AlumniNet — Branching Strategy & CI/CD Documentation

This document defines the team branching model, pull request workflow, and automated GitHub Actions CI/CD pipeline setup.

---

## 🌿 Branching Model & Workflow Strategy

To maintain a stable production codebase while 4 team members develop features concurrently, AlumniNet uses a GitFlow-style branching model:

```
main (Production Ready)
 └── development (Integration Branch)
      ├── feature/auth-security     (Member 1)
      ├── feature/query-optimize   (Member 2)
      ├── feature/ui-dashboard     (Member 3)
      └── feature/ai-recommender   (Member 4)
```

### Branch Rules & Responsibilities

| Branch | Protection Rules | Allowed Operations |
|--------|------------------|--------------------|
| `main` | Protected. Direct pushes disabled. Requires PR with 1 approval & passing CI/CD status checks. | Production releases & deployment triggers. |
| `development` | Default integration branch. All feature branches merge here via PR. | System-wide feature integration & pre-release testing. |
| `feature/*` | Created by team members for individual task stages (e.g. `feature/stage-1-auth`). | Active development, local testing, and PR creation. |

---

## 🤖 GitHub Actions CI/CD Workflows

AlumniNet includes 3 automated workflows located in `.github/workflows/`:

### 1. Code Quality & Syntax Verification (`lint.yml`)
- **Triggers:** Push or Pull Request to `main` or `development`.
- **Jobs:**
  - `lint-backend`: Validates Node.js syntax in backend files (`node --check server.js`).
  - `lint-frontend`: Verifies React Vite production build (`npm run build`).

### 2. Automated Test Suite (`test.yml`)
- **Triggers:** Push or Pull Request to `main` or `development`.
- **Jobs:**
  - Spins up a real `mongo:7.0` database service container in the GitHub runner.
  - Connects to test MongoDB instance and validates configuration keys.

### 3. Docker Build & Deployment Pipeline (`deploy.yml`)
- **Triggers:** Push to `main`.
- **Jobs:**
  - Uses `docker/setup-buildx-action` to compile both Backend and Frontend Docker images.
  - Validates zero Docker build errors before release deployment.

---

## 🔐 Configuring GitHub Repository Secrets

When setting up automated deployment to cloud platforms (Render, Vercel, Railway), configure these Secrets in GitHub repository settings (**Settings -> Secrets and variables -> Actions**):

| Secret Name | Purpose | Example Value |
|-------------|---------|---------------|
| `RENDER_API_KEY` | Render API Token for auto-deploy trigger | `rnd_xxxxxxxxxxxxxxxx` |
| `VERCEL_TOKEN` | Vercel Deployment Token | `vc_xxxxxxxxxxxxxxxx` |
| `MONGODB_URI_PROD` | Production MongoDB Atlas Connection String | `mongodb+srv://user:pass@cluster.mongodb.net/alumninet` |
| `REDIS_URL_PROD` | Production Upstash/Redis Cloud Connection String | `redis://default:pass@endpoint:port` |
| `JWT_SECRET_PROD` | Production 128-char JWT Secret | `generated_sha256_random_string` |
