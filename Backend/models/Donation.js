const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [1, 'Donation amount must be at least ₹1'],
    },
    purpose: {
      type: String,
      required: true,
      trim: true,
      enum: [
        'Scholarship Fund',
        'Infrastructure',
        'Research & Development',
        'Sports & Events',
        'General Fund',
      ],
    },
    // Razorpay fields
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    paymentId: {
      type: String,
      default: null,
    },
    signature: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    currency: {
      type: String,
      default: 'INR',
    },
    message: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
  },
  { timestamps: true }
);

// Index for fetching user's donations and admin reports
donationSchema.index({ donor: 1, createdAt: -1 });
donationSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Donation', donationSchema);
