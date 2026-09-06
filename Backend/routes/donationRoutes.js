const express = require('express');
const { createOrder, verifyPayment, getDonationHistory, getAllDonations } = require('../controllers/donationController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');
const { body, validationResult } = require('express-validator');
const { AppError } = require('../middleware/errorMiddleware');
const router = express.Router();

const validateCreateOrder = [
  body('amount')
    .notEmpty().withMessage('Amount is required.')
    .isFloat({ min: 1 }).withMessage('Amount must be at least ₹1.'),
  body('purpose')
    .notEmpty().withMessage('Purpose is required.')
    .isIn(['Scholarship Fund', 'Infrastructure', 'Research & Development', 'Sports & Events', 'General Fund'])
    .withMessage('Invalid donation purpose.'),
  body('message').optional().isLength({ max: 500 }).withMessage('Message cannot exceed 500 characters.'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(new AppError(errors.array().map(e => e.msg).join('. '), 400));
    next();
  },
];

const validateVerifyPayment = [
  body('razorpay_order_id').notEmpty().withMessage('Order ID is required.'),
  body('razorpay_payment_id').notEmpty().withMessage('Payment ID is required.'),
  body('razorpay_signature').notEmpty().withMessage('Signature is required.'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(new AppError(errors.array().map(e => e.msg).join('. '), 400));
    next();
  },
];

router.use(protect);

router.post('/create-order', validateCreateOrder, createOrder);
router.post('/verify-payment', validateVerifyPayment, verifyPayment);
router.get('/my-history', getDonationHistory);
router.get('/all', adminOnly, getAllDonations); // Admin only

module.exports = router;
