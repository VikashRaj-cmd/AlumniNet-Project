const express = require('express');
const {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validateRegister, validateLogin } = require('../middleware/validationMiddleware');
const { body, validationResult } = require('express-validator');
const { AppError } = require('../middleware/errorMiddleware');
const router = express.Router();

const validateForgotPassword = [
  body('email').trim().notEmpty().withMessage('Email is required.').isEmail().withMessage('Please provide a valid email.').normalizeEmail(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(new AppError(errors.array().map(e => e.msg).join('. '), 400));
    next();
  },
];

const validateResetPassword = [
  body('password').notEmpty().withMessage('Password is required.').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.').matches(/\d/).withMessage('Password must contain at least one number.'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(new AppError(errors.array().map(e => e.msg).join('. '), 400));
    next();
  },
];

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.post('/reset-password/:token', validateResetPassword, resetPassword);

module.exports = router;
