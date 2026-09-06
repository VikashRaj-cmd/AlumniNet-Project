const express = require('express');
const { getAllMentors } = require('../controllers/mentorshipController');
const { protect } = require('../middleware/authMiddleware');
const { cacheMiddleware } = require('../middleware/cacheMiddleware');
const router = express.Router();

router.get('/', protect, cacheMiddleware(300), getAllMentors);

module.exports = router;
