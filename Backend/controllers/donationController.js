// TODO: MANUAL SETUP REQUIRED — See manual_setup.md in root directory (Section 2: Razorpay Setup)
// Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your .env file
// Without these, donation APIs return 503 (server still works normally for all other features)
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Donation = require('../models/Donation');
const { AppError } = require('../middleware/errorMiddleware');

// Initialize Razorpay instance
const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new AppError('Payment gateway is not configured. Please contact admin.', 503);
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

// Step 1: Create Razorpay order
exports.createOrder = async (req, res, next) => {
  try {
    const { amount, purpose, message } = req.body;

    const razorpay = getRazorpay();

    const options = {
      amount: Math.round(amount * 100), // Razorpay accepts amount in paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        purpose,
        donorId: req.user._id.toString(),
        donorName: req.user.name,
      },
    };

    const order = await razorpay.orders.create(options);

    // Save pending donation to DB
    const donation = await Donation.create({
      donor: req.user._id,
      amount,
      purpose,
      orderId: order.id,
      message: message || '',
      status: 'pending',
    });

    res.status(201).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      donationId: donation._id,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    next(error);
  }
};

// Step 2: Verify Razorpay payment signature and confirm donation
exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify signature using HMAC SHA256
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      // Mark donation as failed
      await Donation.findOneAndUpdate(
        { orderId: razorpay_order_id },
        { status: 'failed' }
      );
      return next(new AppError('Payment verification failed. Invalid signature.', 400));
    }

    // Mark donation as completed
    const donation = await Donation.findOneAndUpdate(
      { orderId: razorpay_order_id },
      {
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        status: 'completed',
      },
      { new: true }
    ).populate('donor', 'name email');

    if (!donation) {
      return next(new AppError('Donation record not found.', 404));
    }

    res.json({
      message: 'Payment verified successfully. Thank you for your donation!',
      donation,
    });
  } catch (error) {
    next(error);
  }
};

// Get logged-in user's donation history
exports.getDonationHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [donations, total] = await Promise.all([
      Donation.find({ donor: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Donation.countDocuments({ donor: req.user._id }),
    ]);

    res.json({
      donations,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get all donations with stats
exports.getAllDonations = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { status } = req.query;

    const filter = status ? { status } : {};

    const [donations, total, stats] = await Promise.all([
      Donation.find(filter)
        .populate('donor', 'name email department batch')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Donation.countDocuments(filter),
      Donation.aggregate([
        { $match: { status: 'completed' } },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            totalDonations: { $sum: 1 },
            avgDonation: { $avg: '$amount' },
          },
        },
      ]),
    ]);

    res.json({
      donations,
      stats: stats[0] || { totalAmount: 0, totalDonations: 0, avgDonation: 0 },
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};
