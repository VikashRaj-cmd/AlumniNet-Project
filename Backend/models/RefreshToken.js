const mongoose = require('mongoose');
const crypto = require('crypto');

const refreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  createdByIp: {
    type: String,
    default: '',
  },
  isRevoked: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Index for auto-cleanup of expired tokens
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to generate a secure random refresh token
refreshTokenSchema.statics.generateToken = function () {
  return crypto.randomBytes(40).toString('hex');
};

// Instance method to check if token is expired
refreshTokenSchema.methods.isExpired = function () {
  return Date.now() >= this.expiresAt;
};

// Instance method to check if token is active (not expired, not revoked)
refreshTokenSchema.methods.isActive = function () {
  return !this.isRevoked && !this.isExpired();
};

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
