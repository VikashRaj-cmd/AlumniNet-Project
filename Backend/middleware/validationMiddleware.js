const { body, param, query, validationResult } = require('express-validator');
const { AppError } = require('./errorMiddleware');

// Generic handler that checks validation results and returns errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((err) => err.msg);
    return next(new AppError(messages.join('. '), 400));
  }
  next();
};

// ─── AUTH VALIDATIONS ────────────────────────────────────────────

const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required.')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters.'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.')
    .matches(/\d/).withMessage('Password must contain at least one number.'),

  body('role')
    .notEmpty().withMessage('Role is required.')
    .isIn(['student', 'alumni', 'admin']).withMessage('Role must be student, alumni, or admin.'),

  body('batch')
    .trim()
    .notEmpty().withMessage('Batch year is required.'),

  body('department')
    .trim()
    .notEmpty().withMessage('Department is required.'),

  handleValidationErrors,
];

const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required.'),

  handleValidationErrors,
];

// ─── EVENT VALIDATIONS ──────────────────────────────────────────

const validateCreateEvent = [
  body('title')
    .trim()
    .notEmpty().withMessage('Event title is required.')
    .isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters.'),

  body('description')
    .trim()
    .notEmpty().withMessage('Event description is required.'),

  body('date')
    .notEmpty().withMessage('Event date is required.')
    .isISO8601().withMessage('Please provide a valid date.'),

  body('location')
    .trim()
    .notEmpty().withMessage('Event location is required.'),

  handleValidationErrors,
];

// ─── INTERNSHIP/JOB VALIDATIONS ─────────────────────────────────

const validateCreateInternship = [
  body('title')
    .trim()
    .notEmpty().withMessage('Job title is required.')
    .isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters.'),

  body('company')
    .trim()
    .notEmpty().withMessage('Company name is required.'),

  body('description')
    .trim()
    .notEmpty().withMessage('Job description is required.'),

  body('location')
    .trim()
    .notEmpty().withMessage('Location is required.'),

  body('type')
    .notEmpty().withMessage('Type is required.')
    .isIn(['internship', 'job']).withMessage('Type must be internship or job.'),

  handleValidationErrors,
];

// ─── PROFILE VALIDATIONS ───────────────────────────────────────

const validateUpdateProfile = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters.'),

  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail(),

  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9+\-\s()]{7,15}$/).withMessage('Please provide a valid phone number.'),

  body('linkedin')
    .optional()
    .trim()
    .isURL().withMessage('Please provide a valid LinkedIn URL.'),

  body('github')
    .optional()
    .trim()
    .isURL().withMessage('Please provide a valid GitHub URL.'),

  body('portfolio')
    .optional()
    .trim()
    .isURL().withMessage('Please provide a valid portfolio URL.'),

  handleValidationErrors,
];

// ─── OBJECT ID VALIDATION ──────────────────────────────────────

const validateObjectId = [
  param('id')
    .isMongoId().withMessage('Invalid ID format.'),

  handleValidationErrors,
];

module.exports = {
  validateRegister,
  validateLogin,
  validateCreateEvent,
  validateCreateInternship,
  validateUpdateProfile,
  validateObjectId,
  handleValidationErrors,
};
