const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Track online users: { userId: socketId }
const onlineUsers = new Map();

const initializeSocket = (io) => {
  // ─── AUTHENTICATION MIDDLEWARE ───────────────────────────────────
  // Verify JWT token before allowing socket connection
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication token missing.'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('User not found.'));
      }

      socket.user = user; // Attach user to socket
      next();
    } catch (error) {
      next(new Error('Authentication failed. Invalid or expired token.'));
    }
  });

  // ─── CONNECTION HANDLER ─────────────────────────────────────────
  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    console.log(`🟢 Socket connected: ${socket.user.name} (${userId})`);

    // ─── JOIN PERSONAL ROOM ───────────────────────────────────────
    // Each user joins a room named after their userId
    // This allows direct message targeting: io.to(userId).emit(...)
    socket.join(userId);

    // ─── TRACK ONLINE STATUS ─────────────────────────────────────
    onlineUsers.set(userId, socket.id);

    // Broadcast online status to all connected users
    io.emit('userOnline', {
      userId,
      name: socket.user.name,
    });

    // Send current online users list to the newly connected user
    socket.emit('onlineUsers', Array.from(onlineUsers.keys()));

    // ─── JOIN CONVERSATION ROOM ───────────────────────────────────
    socket.on('joinRoom', (conversationId) => {
      socket.join(conversationId);
      console.log(`${socket.user.name} joined room: ${conversationId}`);
    });

    // ─── LEAVE CONVERSATION ROOM ──────────────────────────────────
    socket.on('leaveRoom', (conversationId) => {
      socket.leave(conversationId);
      console.log(`${socket.user.name} left room: ${conversationId}`);
    });

    // ─── TYPING INDICATORS ───────────────────────────────────────
    socket.on('typing', ({ conversationId, receiverId }) => {
      // Emit to the receiver's personal room
      socket.to(receiverId).emit('userTyping', {
        userId,
        name: socket.user.name,
        conversationId,
      });
    });

    socket.on('stopTyping', ({ conversationId, receiverId }) => {
      socket.to(receiverId).emit('userStoppedTyping', {
        userId,
        conversationId,
      });
    });

    // ─── DISCONNECT ──────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`🔴 Socket disconnected: ${socket.user.name} (${userId})`);

      // Remove from online users
      onlineUsers.delete(userId);

      // Broadcast offline status
      io.emit('userOffline', {
        userId,
        name: socket.user.name,
        lastSeen: new Date(),
      });
    });
  });
};

// Get current online users (used by other modules if needed)
const getOnlineUsers = () => Array.from(onlineUsers.keys());

module.exports = { initializeSocket, getOnlineUsers };
