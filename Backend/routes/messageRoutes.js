const express = require('express');
const {
  sendMessage,
  getConversations,
  getConversationMessages,
  markAsRead,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator');
const { AppError } = require('../middleware/errorMiddleware');
const router = express.Router();

// Validation for sending a message
const validateSendMessage = [
  body('receiverId').notEmpty().withMessage('Receiver ID is required.').isMongoId().withMessage('Invalid receiver ID.'),
  body('content').trim().notEmpty().withMessage('Message content is required.').isLength({ max: 2000 }).withMessage('Message cannot exceed 2000 characters.'),
  body('messageType').optional().isIn(['text', 'image', 'file']).withMessage('Invalid message type.'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array().map(e => e.msg).join('. '), 400));
    }
    next();
  },
];

// All routes require authentication
router.use(protect);

router.post('/send', validateSendMessage, sendMessage);
router.get('/conversations', getConversations);
router.get('/conversation/:id', getConversationMessages);
router.put('/conversation/:id/read', markAsRead);

module.exports = router;
