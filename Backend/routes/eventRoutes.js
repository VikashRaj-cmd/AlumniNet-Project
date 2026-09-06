const express = require('express');
const { createEvent, getAllEvents, registerForEvent } = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');
const { alumniOrAdmin } = require('../middleware/roleMiddleware');
const { validateCreateEvent, validateObjectId } = require('../middleware/validationMiddleware');
const router = express.Router();

router.post('/', protect, alumniOrAdmin, validateCreateEvent, createEvent);
router.get('/', protect, getAllEvents);
router.post('/:id/register', protect, validateObjectId, registerForEvent);

module.exports = router;
