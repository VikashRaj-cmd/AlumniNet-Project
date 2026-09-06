# AlumniNet — Comprehensive College Viva & Technical Interview Guide
> **Note:** This file is local-only (included in `.gitignore`). Do not push confidential viva prep notes to GitHub.

---

## 1. Executive Project Overview

**AlumniNet** is a production-grade, full-stack Alumni-Student Networking & Career Platform. It bridges the gap between university alumni and current students by facilitating real-time networking, mentorship, job/internship postings, event registrations, and alumni donations.

### 🏛 Microservice-Style Architecture Flow

```
[ Browser / Client (React 18 SPA) ]
                │
                │ (HTTP Requests / WebSocket Connection)
                ▼
      [ Nginx Reverse Proxy ] (Docker Port 3000 / 80)
        │                 │
        │ /api/*          │ /socket.io/*
        ▼                 ▼
   [ Express REST API ] [ Socket.io Server ] (Node.js Port 5000)
        │                 │
        ├─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
 [ MongoDB Atlas ]   [ Redis Store ]   [ Nodemailer SMTP / Razorpay ]
 (Database)          (Cache/Sessions)  (External Services)
```

---

## 2. Deep-Dive into Technologies & Concepts

---

### A. Docker & Containerization (Stage 5)

#### What is Docker?
Docker is an open-source platform that packages applications and all their dependencies into lightweight, isolated execution units called **Containers**. It eliminates the classic *"It works on my machine"* problem by providing an identical runtime environment across development, testing, and production.

#### Multi-Stage Builds (Why & How?)
A standard Node.js Docker image can exceed 1 GB in size because it contains build compilers, source code, and cached package managers.
- **Builder Stage (`node:20-alpine`):** Installs build tools and dependencies.
- **Runner Stage (`node:20-alpine` / `nginx:alpine`):** Copies only the compiled output (`dist/` or `node_modules/`) and leaves behind build tools.
- **Result:** Image size drops from **1 GB+ to under 120 MB**, drastically speeding up deployments and enhancing security.

#### Security Practices Implemented:
1. **Non-Root User:** Runs the Node process under `USER node` instead of `root` to prevent container escape exploits.
2. **Health Checks:** Built-in `HEALTHCHECK` commands monitor container status every 30 seconds (`/api/health`).

#### Nginx Reverse Proxy:
In production, Nginx acts as a high-performance web server:
1. **SPA Routing:** Routes all unknown requests to `index.html` (resolving React Router 404 refresh errors via `try_files $uri /index.html`).
2. **API Reverse Proxy:** Proxies `/api` requests to `http://backend:5000` internally, avoiding CORS issues in production.
3. **WebSocket Proxy:** Upgrades HTTP headers (`Upgrade: websocket`) to maintain persistent Socket.io connections.

#### Docker Compose (`docker-compose.yml`):
Orchestrates 4 interconnected containers:
- `frontend` (React + Nginx on port 3000)
- `backend` (Node.js + Express on port 5000)
- `mongo` (MongoDB 7.0 database on port 27017)
- `redis` (Redis 7 Alpine cache on port 6379)
- **Health-based Start Order (`depends_on`):** Backend waits for MongoDB and Redis to pass health checks (`condition: service_healthy`) before starting.

---

### B. Real-Time Communication with Socket.io (Stage 2)

#### HTTP vs WebSockets:
- **HTTP (Stateless Request-Response):** Client opens TCP connection -> Sends request -> Receives response -> Connection closes. High overhead for real-time applications.
- **WebSocket (Full-Duplex Persistent):** Client performs an initial HTTP Handshake -> Upgrades connection to WebSocket -> Single persistent TCP connection stays open for bi-directional real-time data flow with near-zero latency.

#### Authentication in Socket.io:
Before a socket connection is established, the client passes a JWT token in `socket.handshake.auth.token`. Socket middleware verifies the token; if invalid, connection is rejected immediately.

#### Rooms Architecture:
1. **Personal Rooms:** Each user joins a private room named `userId` upon connecting (`socket.join(userId)`). This allows targeted 1-on-1 messaging (`io.to(receiverId).emit(...)`).
2. **Conversation Rooms:** Users join shared rooms (`conversationId`) for active group or direct chat windows.

#### Online Tracking via Redis (Stage 4 Upgrade):
Instead of keeping online users in a single server's Node.js memory Map (which breaks when scaling across multiple server instances), user online states are stored in a **Redis Hash (`online_users`)**. When any instance receives a connect/disconnect, it updates Redis and broadcasts state system-wide.

---

### C. Razorpay Payment Gateway Integration (Stage 3)

#### How Online Payments Work Securely (3-Step Verification):
1. **Order Creation (Backend):** Client requests a donation order. Backend initializes Razorpay SDK and calls `razorpay.orders.create({ amount: 50000, currency: 'INR' })`. Razorpay returns a unique `order_id`.
2. **Client Checkout Modal (Frontend):** Frontend opens the Razorpay popup with the `order_id`. User enters payment details (UPI/Card/NetBanking) directly into Razorpay's secure iframe.
3. **HMAC Signature Verification (Backend Security):** Once payment succeeds, Razorpay gives the client `razorpay_payment_id`, `razorpay_order_id`, and `razorpay_signature`.
   - **Crucial Security Requirement:** The client sends these 3 values to backend POST `/api/donations/verify-payment`.
   - Backend generates expected signature using HMAC-SHA256:
     ```javascript
     generated_signature = hmac_sha256(order_id + "|" + payment_id, RAZORPAY_KEY_SECRET)
     ```
   - If `generated_signature === razorpay_signature`, payment is authentic and saved to DB. If signatures don't match, the payment is rejected as tampered!

---

### D. Nodemailer Email System & Password Reset Flow (Stage 3)

#### Nodemailer Architecture:
Uses SMTP (Simple Mail Transfer Protocol) with Gmail App Passwords. Emails are sent asynchronously without blocking the API response (e.g., registration finishes instantly while `sendWelcomeEmail().catch(...)` runs in the background).

#### Responsive HTML Templates:
All email templates (Welcome, Password Reset, Event Invites, Mentorship Requests) use inline CSS, structured tables, and colored status badges ensuring proper rendering on all email clients (Gmail, Outlook, Mobile).

#### Secure Password Reset Flow:
1. User requests reset for `email` -> Backend generates a cryptographically secure random token (`crypto.randomBytes(32).toString('hex')`).
2. **Security Best Practice:** The plain token is **NEVER** stored in the database. Backend hashes the token using `SHA256` and saves `resetPasswordToken` and `resetPasswordExpire` (15 min window) in MongoDB and Redis.
3. Plain token is emailed in link: `http://frontend/reset-password/<plain_token>`.
4. When user submits new password, backend hashes the incoming token and searches for matching hash in Redis/MongoDB.

---

### E. Redis Caching & Token Blacklisting (Stage 4)

#### What is Redis?
Redis is an open-source, in-memory key-value data store providing sub-millisecond data access speeds (O(1) time complexity).

#### Caching Layer (`cacheMiddleware.js`):
1. Express GET requests pass through `cacheMiddleware(ttlSeconds)`.
2. Middleware checks Redis key `cache:/api/events?page=1`.
3. **Cache HIT:** Returns cached JSON immediately with HTTP header `X-Cache: HIT` (bypassing MongoDB completely).
4. **Cache MISS:** Intercepts `res.json()`, sends response to client with `X-Cache: MISS`, and saves body into Redis with TTL (Time-To-Live).

#### Cache Invalidation Strategy (`clearCache`):
When write operations occur (POST/PUT/DELETE event, internship, profile update), matching Redis key patterns (e.g., `cache:/api/events*`) are cleared instantly to prevent serving stale data.

#### Token Blacklisting on Logout:
When a user logs out, their JWT access token is stored in Redis under `blacklist:<token>` with a TTL equal to the token's remaining lifespan. The `protect` auth middleware checks Redis on every request; if blacklisted, access is denied immediately.

---

### F. Security Hardening & RBAC (Stage 1)

1. **JWT Dual Token Architecture:**
   - **Access Token:** Expiration 15 minutes, passed in `Authorization: Bearer <token>` header.
   - **Refresh Token:** Expiration 7 days, stored in `httpOnly` secure cookie (inaccessible to malicious client-side JavaScript, preventing XSS token theft).
2. **RBAC (Role-Based Access Control):** `authorize('admin', 'alumni')` middleware checks authenticated user's `role` enum.
3. **Security Headers (Helmet):** Sets HTTP headers (`X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`).
4. **NoSQL Injection Defense:** `express-mongo-sanitize` strips out dangerous operator keys (`$gt`, `$ne`) from request bodies.
5. **Rate Limiting:** `express-rate-limit` prevents brute-force login attacks (max 10 auth requests per 15 min window).

---

### G. CI/CD Pipeline & GitHub Actions (Stage 6)

#### What is CI/CD?
- **Continuous Integration (CI):** Automatically builds, lints, and tests every developer commit before merging to main, catching syntax errors and bugs early.
- **Continuous Deployment (CD):** Automatically packages and deploys verified code to production cloud environments (Render, Vercel) whenever changes hit `main`.

#### GitHub Actions Workflows Implemented:
1. **Linting Workflow (`lint.yml`):** Runs on push/PR to validate Node.js syntax and React Vite bundle compilation.
2. **Automated Test Workflow (`test.yml`):** Spins up an ephemeral `mongo:7.0` container on GitHub runners and executes database connectivity and configuration tests.
3. **Build & Deploy Pipeline (`deploy.yml`):** Builds both Backend and Frontend Docker images on push to `main` to verify zero release compile errors.

---

### H. Cloud File Storage & Swagger API Documentation (Stage 7)

#### Cloud Storage Architecture (`storage.js`):
- **Cloudinary Integration:** Automatically uploads avatar photos and PDF resumes to Cloudinary cloud CDN (`alumninet/avatars`, `alumninet/resumes`).
- **Graceful Local Fallback:** If Cloudinary keys are not set, falls back seamlessly to local disk storage (`/uploads`), ensuring zero crashes in local development.
- **Multer File Validation:** Enforces MIME type checking (JPEG, PNG, WEBP, PDF, DOCX) and 5 MB size limit.

#### Interactive Swagger OpenAPI Documentation (`/api-docs`):
- Generates interactive OpenAPI 3.0 specs using `swagger-jsdoc` and `swagger-ui-express`.
- Hosted live at `/api-docs` on the Express server.
- Allows developers and reviewers to test all endpoints, view request/response schemas, and input Bearer JWT authentication tokens directly in the browser UI.

---

### I. Resume Intelligence, ATS Analyzer & LaTeX Builder (Major Enhancement)

#### System Architecture & Flow:
1. **Resume Parser (`atsService.js`):** Extracts raw text, emails, phones, LinkedIn/GitHub links, and technical skills using Regex and NLP keyword matching against a 100+ technical skill dictionary.
2. **ATS Compatibility Scorer (`calculateAtsScore`):** Calculates an ATS Score (0 - 100) based on contact details, essential sections, tech skill density, and action verbs/metrics. Generates actionable AI improvement suggestions.
3. **Job / Internship Matcher (`matchJobWithResume`):** Compares user's extracted skills against job requirements in MongoDB, providing match percentages ($\text{Match Score} = 40\% \text{ Skills} + 30\% \text{ Keywords} + 20\% \text{ Edu} + 10\% \text{ Exp}$) and missing skill recommendations.
4. **LaTeX Resume Builder (`latexService.js`):** Ships with 6 curated templates featuring the **Jake Gutierrez (sb2nov) Technical One-Page Template** pre-selected as default for B.Tech & Engineering students. Converts structured JSON into clean LaTeX code.

---

## 3. Top Viva & Interview Questions (Quick Answers)

#### Q1: Why use JWT Access Tokens + Refresh Tokens instead of single long-lived tokens?
> **Answer:** Short-lived access tokens (15 mins) reduce damage if a token is intercepted. Refresh tokens (7 days) stored in `httpOnly` cookies allow seamless background re-authentication without requiring the user to type their password continuously, while protecting the refresh token from XSS attacks.

#### Q2: How does Socket.io ensure real-time communication?
> **Answer:** Socket.io starts with an HTTP long-polling handshake and upgrades to a persistent WebSocket connection. It uses event-driven communication (`socket.emit` and `socket.on`) and room abstractions to push messages instantly from server to specific clients.

#### Q3: Why is signature verification mandatory in Razorpay payment gateway?
> **Answer:** Without signature verification on the backend, a malicious user could inspect network traffic and send a fake "success" HTTP request to our server without actually paying money. HMAC-SHA256 signature verification guarantees that the payment response originated genuinely from Razorpay.

#### Q4: How do you prevent stale cache data when using Redis?
> **Answer:** We enforce cache invalidation middleware (`clearCache`). Whenever a write/update operation happens (e.g., creating a new event), we execute a wildcard deletion (`deleteCachePattern('cache:/api/events*')`) in Redis so subsequent read requests fetch fresh data from MongoDB.

#### Q5: What is the main advantage of Docker multi-stage builds?
> **Answer:** Multi-stage builds separate the build environment from the final execution environment. By leaving build compilers and devDependencies behind in the build stage, the final production container image size is reduced by up to 90%, improving deployment speed and security.

#### Q6: Why use Nginx inside the frontend Docker container instead of `vite preview` or `serve`?
> **Answer:** Nginx is an industrial-grade web server optimized for static file serving, SSL termination, gzip compression, and reverse proxying. It efficiently handles SPA client-side route fallback (`try_files $uri /index.html`) and proxies `/api` calls seamlessly to the backend container.

#### Q7: What is the role of CI/CD pipelines and GitHub Actions in your project?
> **Answer:** GitHub Actions automates quality assurance. Whenever a team member pushes code or creates a Pull Request, automated workflows execute in parallel on GitHub runners: validating code syntax, spinning up a containerized MongoDB test database to run integration checks, and compiling Docker release builds before code is merged into `main`.

#### Q8: How does your application handle file uploads and API documentation?
> **Answer:** File uploads use Multer middleware for file validation and route to Cloudinary CDN with a local disk fallback if cloud keys are absent. API documentation is auto-generated using OpenAPI 3.0 and served interactively at `/api-docs` via Swagger UI.

#### Q9: How does the AI Resume Parser & ATS Scorer work in your platform?
> **Answer:** The Resume Parser extracts text from binary PDF buffers using a multi-strategy `PDFParse` parser with `Uint8Array` binary stream decoding. It parses contact details (email, phone, LinkedIn, GitHub), technical skills matched against a 50+ tech dictionary, and section blocks (Education, Experience, Projects, Certifications). The ATS Scorer evaluates formatting, section completeness, skill count, action verbs (`Developed`, `Implemented`, `Optimized`), and quantified metrics (`%`, `users`, `ms`) to compute an ATS compatibility score (0-100) with AI improvement suggestions.

#### Q10: Why did you choose the Jake Gutierrez (sb2nov) template as default for the LaTeX Resume Builder?
> **Answer:** The Jake Gutierrez template is an industry-standard, single-column, compact 1-page LaTeX layout that passes automated ATS parsing systems with maximum fidelity. It is ideal for engineering students to showcase projects, DSA skills, education, and technical certifications. Our backend automatically escapes LaTeX special characters (`\&`, `\%`, `\$`, `\#`, `\_`) to guarantee error-free compilation on Overleaf.

---

## 4. Complete System Endpoints Checklist

| Module | Method | Endpoint | Access | Cache TTL |
|--------|--------|----------|--------|-----------|
| **Auth** | `POST` | `/api/auth/register` | Public | None |
| | `POST` | `/api/auth/login` | Public | None |
| | `POST` | `/api/auth/refresh` | Public (Cookie) | None |
| | `POST` | `/api/auth/logout` | Protected | Blacklists Token |
| | `GET` | `/api/auth/me` | Protected | None |
| | `POST` | `/api/auth/forgot-password` | Public | Redis OTP (15m) |
| | `POST` | `/api/auth/reset-password/:token` | Public | None |
| **Alumni** | `GET` | `/api/alumni/search` | Protected | 5 Mins |
| | `GET` | `/api/alumni/filters/departments` | Protected | 10 Mins |
| | `GET` | `/api/alumni/filters/batches` | Protected | 10 Mins |
| | `GET` | `/api/alumni/filters/companies` | Protected | 10 Mins |
| | `GET` | `/api/alumni/:id` | Protected | 5 Mins |
| **Events** | `GET` | `/api/events` | Protected | 3 Mins |
| | `POST` | `/api/events` | Alumni / Admin | Clears Event Cache |
| | `POST` | `/api/events/:id/register` | Protected | Clears Event Cache |
| **Jobs** | `GET` | `/api/internships` | Protected | 3 Mins |
| | `POST` | `/api/internships` | Alumni / Admin | Clears Job Cache |
| | `POST` | `/api/internships/:id/apply` | Protected | Clears Job Cache |
| **Resume & ATS** | `POST` | `/api/resume/parse-and-analyze` | Protected | Upload 10MB PDF / Text |
| | `GET` | `/api/resume/my-resume` | Protected | User Resume & Score |
| | `GET` | `/api/resume/templates` | Protected | 6 LaTeX Templates |
| | `POST` | `/api/resume/generate-latex` | Protected | Custom LaTeX Source |
| | `POST` | `/api/resume/save` | Protected | Saves Resume & LaTeX |
| | `GET` | `/api/resume/recommend-jobs` | Protected | ATS Skill-Matched Jobs |
| | `GET` | `/api/resume/match-job/:jobId` | Protected | Job-Specific ATS Match |
| **Donations** | `POST` | `/api/donations/create-order` | Protected | None |
| | `POST` | `/api/donations/verify-payment` | Protected | None |
| | `GET` | `/api/donations/my-history` | Protected | None |
| | `GET` | `/api/donations/all` | Admin | None |
| **Admin** | `GET` | `/api/admin/stats` | Admin | 1 Min |
| | `GET` | `/api/admin/analytics` | Admin | 5 Mins |
| | `GET` | `/api/admin/users` | Admin | None |
| | `PUT` | `/api/admin/users/:id/role` | Admin | Clears Admin/Alumni Cache |
| | `DELETE` | `/api/admin/users/:id` | Admin | Clears Admin/Alumni Cache |

