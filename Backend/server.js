require('dotenv').config();
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const config = require('./config/config');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');
const { initializeSocket } = require('./socket/chatSocket');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');
const internshipRoutes = require('./routes/internshipRoutes');
const mentorshipRoutes = require('./routes/mentorshipRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const alumniRoutes = require('./routes/alumniRoutes');
const donationRoutes = require('./routes/donationRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// ─── CONNECT DATABASE ─────────────────────────────────────────────
connectDB();

// ─── SECURITY MIDDLEWARE ──────────────────────────────────────────
app.use(helmet());

app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(mongoSanitize());
app.use(hpp());

// ─── LOGGING ─────────────────────────────────────────────────────
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ─── RATE LIMITING ────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  message: { status: 'fail', message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', globalLimiter);

const authLimiter = rateLimit({
  windowMs: config.authRateLimitWindowMs,
  max: config.authRateLimitMax,
  message: { status: 'fail', message: 'Too many login attempts, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ─── HEALTH CHECK ─────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// ─── API ROUTES ───────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/internships', internshipRoutes);
app.use('/api/mentors', mentorshipRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/alumni', alumniRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/admin', adminRoutes);

// ─── ERROR HANDLING ───────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── HTTP + SOCKET.IO SERVER ──────────────────────────────────────
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: config.frontendUrl,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Initialize Socket.io event handlers
initializeSocket(io);

// Make `io` accessible in controllers via req.app.get('io')
app.set('io', io);

// ─── START SERVER ─────────────────────────────────────────────────
const PORT = config.port;
server.listen(PORT, () => {
  console.log(`[SERVER] Running in ${config.nodeEnv} mode on port ${PORT}`);
  console.log(`[SOCKET] Socket.io ready for real-time connections`);
});
