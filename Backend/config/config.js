// Centralized configuration management
// All environment variables are accessed through this file

const config = {
  // Server
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // MongoDB
  mongoUri: process.env.MONGODB_URI,

  // JWT
  jwtSecret: process.env.JWT_SECRET,
  jwtAccessExpire: process.env.JWT_ACCESS_EXPIRE || '15m',
  jwtRefreshDays: parseInt(process.env.JWT_REFRESH_DAYS) || 7,

  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100, // max requests per window

  // Auth Rate Limiting (stricter)
  authRateLimitWindowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  authRateLimitMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 10,

  // Email (Nodemailer) — to be configured in Stage 3
  smtpHost: process.env.SMTP_HOST,
  smtpPort: parseInt(process.env.SMTP_PORT) || 587,
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  fromEmail: process.env.FROM_EMAIL || 'noreply@alumninet.com',

  // Frontend URL (for CORS and email links)
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  // Redis — to be configured in Stage 4
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
};

// Validate required environment variables
const requiredVars = ['MONGODB_URI', 'JWT_SECRET'];
const missing = requiredVars.filter((v) => !process.env[v]);

if (missing.length > 0) {
  console.error(`[ERROR] Missing required environment variables: ${missing.join(', ')}`);
  console.error('Please check your .env file.');
  process.exit(1);
}

module.exports = config;
