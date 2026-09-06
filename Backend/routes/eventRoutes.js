const express = require('express');
const { createEvent, getAllEvents, registerForEvent } = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');
const { alumniOrAdmin } = require('../middleware/roleMiddleware');
const { validateCreateEvent, validateObjectId } = require('../middleware/validationMiddleware');
const { cacheMiddleware, clearCache } = require('../middleware/cacheMiddleware');
const router = express.Router();

router.post('/', protect, alumniOrAdmin, validateCreateEvent, clearCache('cache:/api/events*'), createEvent);
router.get('/', protect, cacheMiddleware(180), getAllEvents);
router.post('/:id/register', protect, validateObjectId, clearCache('cache:/api/events*'), registerForEvent);

module.exports = router;
