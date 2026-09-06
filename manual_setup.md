# AlumniNet — Master Manual Setup & Free Cloud Deployment Guide
> **Location:** Root Directory (`manual_setup.md`) — Included in `.gitignore` (Local reference only)

This document contains step-by-step instructions for all manual tasks deferred during development (Email, Razorpay, Redis, Cloud Storage) and a **100% FREE Cloud Deployment Plan** tailored for your college project so you don't need to spend any money!

---

## 🆓 100% FREE Cloud Deployment Architecture (Zero Cost)

You do **NOT** need to pay anything or install Docker Desktop on your PC to deploy this project live for college presentation! We will use the best free tier cloud hosting platforms:

| Layer | Service Provider | Cost | Free Limits | Purpose |
|-------|------------------|------|-------------|---------|
| **Frontend UI** | **Render / Vercel** | 100% FREE | Unlimited bandwidth & builds | Hosts React 18 SPA client live on internet |
| **Backend API** | **Render / Railway / Koyeb** | 100% FREE | 750 free instance hours/month | Hosts Node.js Express REST API & Socket.io |
| **Database** | **MongoDB Atlas** | 100% FREE | M0 Cluster (512 MB storage) | Cloud NoSQL Database |
| **Cache & Sessions** | **Upstash Redis / Redis Cloud** | 100% FREE | 10,000 commands/day | Cloud Redis cache & online user tracking |
| **Media Uploads** | **Cloudinary** | 100% FREE | 25 GB storage & transformation | Profile photos & PDF resume storage |

---

## 📌 Manual Tasks by Stage

### Stage 1 — Production JWT Secrets (Auth Hardening)
- **Status:** Skipped for local dev (`dev_jwt_secret_key_12345` is active).
- **When to do:** Before production deployment.
- **Steps:**
  1. Open terminal and run:
     ```powershell
     node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
     ```
  2. Copy generated 128-character random string.
  3. Paste as `JWT_SECRET` in your production environment variables.

---

### Stage 3 — Email / SMTP Setup (Nodemailer)
- **Status:** Skipped for local dev (emails logged/skipped gracefully, server works normally).
- **When to do:** When ready to test registration/password reset emails.
- **Cost:** 100% FREE (Gmail App Password).
- **Affected Files:** `Backend/config/mail.js`, `Backend/controllers/authController.js`
- **Steps:**
  1. Go to your Gmail account -> Google Account Settings -> Security.
  2. Enable 2-Step Verification (2FA).
  3. Search for **App Passwords** -> Select app: "Mail", device: "Other".
  4. Generate a 16-character App Password (e.g., `abcd efgh ijkl mnop`).
  5. Add to `Backend/.env` (or cloud dashboard):
     ```env
     SMTP_HOST=smtp.gmail.com
     SMTP_PORT=587
     SMTP_USER=your_gmail@gmail.com
     SMTP_PASS=your_16_char_app_password
     FROM_EMAIL=noreply@alumninet.com
     ```

---

### Stage 3 — Razorpay Payment Gateway (Donations)
- **Status:** Skipped for local dev (donation routes return 503 until keys are set, server works normally).
- **When to do:** When testing alumni donation checkout.
- **Cost:** 100% FREE (Razorpay Test Mode).
- **Affected Files:** `Backend/controllers/donationController.js`
- **Steps:**
  1. Register free account at https://razorpay.com
  2. Switch dashboard to **Test Mode** (top toggle bar).
  3. Go to **Settings -> API Keys -> Generate Key**.
  4. Copy Test Key ID and Key Secret.
  5. Add to `Backend/.env` (or cloud dashboard):
     ```env
     RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxxxx
     RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
     ```

---

### Stage 4 — Redis Cloud / Upstash Setup (Caching & Sessions)
- **Status:** Skipped for local dev (Redis client auto-detects offline state and falls back to in-memory mode smoothly).
- **When to do:** When deploying to production cloud.
- **Cost:** 100% FREE (Upstash / Redis Cloud).
- **Affected Files:** `Backend/config/redis.js`, `Backend/middleware/cacheMiddleware.js`, `Backend/socket/chatSocket.js`
- **Steps:**
  1. Sign up at https://upstash.com or https://redis.io/try-free/
  2. Create a Free Redis Database.
  3. Copy the Redis URI string (`redis://default:password@endpoint:port`).
  4. Add to `Backend/.env` (or cloud dashboard):
     ```env
     REDIS_URL=redis://default:password@endpoint:port
     ```

---

### Stage 5 — Docker & Containerization Note
- **Local Laptop:** Docker Desktop is **OPTIONAL**. Your backend and frontend run using `npm run dev`.
- **Cloud Deployment:** Cloud hosting providers like Render and Railway build Docker containers automatically from `Dockerfile` or source code without requiring Docker installed on your PC!

---

### Stage 6 — GitHub Actions CI/CD Secrets (Optional for Live Auto-Deploy)
- **Status:** Skipped for now (CI/CD workflows run automatically on free GitHub runners using ephemeral containers without requiring secret keys).
- **When to do:** Only when you decide to set up automated push-to-deploy to Render or Vercel in the future.
- **Where to add:** On GitHub repository -> **Settings -> Secrets and variables -> Actions**.
- **Keys list:**
  - `RENDER_API_KEY`: Render API deploy trigger token
  - `VERCEL_TOKEN`: Vercel Deployment Token
  - `MONGODB_URI_PROD`: Production MongoDB Atlas connection string
  - `REDIS_URL_PROD`: Production Upstash Redis connection string
  - `JWT_SECRET_PROD`: Production 128-character JWT secret

---

### Stage 7 — Cloudinary File Uploads (Resumes & Profile Photos)
- **Status:** Scheduled for Stage 7 implementation.
- **Cost:** 100% FREE (25 GB free storage).
- **Steps:**
  1. Create free account at https://cloudinary.com
  2. Copy Cloud Name, API Key, and API Secret from Dashboard.
  3. Add to `Backend/.env`:
     ```env
     CLOUDINARY_CLOUD_NAME=your_cloud_name
     CLOUDINARY_API_KEY=your_api_key
     CLOUDINARY_API_SECRET=your_api_secret
     ```

---

## 👥 Team Member Tasks Checklist

| Member | Area | Manual Setup Responsibility |
|--------|------|-----------------------------|
| **Member 1** (Lead/DevOps) | Core Backend, Auth, Docker, Redis, CI/CD | Set up Render, MongoDB Atlas, Upstash Redis, GitHub Actions secrets. |
| **Member 2** (Database/Optimization) | Indexing, Aggregations, Redis Keys | Verify MongoDB Atlas indexes and cache key naming consistency. |
| **Member 3** (Frontend UI) | React SPA, Razorpay Modal, Socket.io UI | Set up Vercel/Render frontend environment variable `VITE_API_URL`. |
| **Member 4** (AI/ML Integration) | Recommendation System | Configure ML model API endpoints for alumni recommendations. |
