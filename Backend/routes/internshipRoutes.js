const express = require('express');
const { createInternship, getAllInternships, applyForInternship } = require('../controllers/internshipController');
const { protect } = require('../middleware/authMiddleware');
const { alumniOrAdmin } = require('../middleware/roleMiddleware');
const { validateCreateInternship, validateObjectId } = require('../middleware/validationMiddleware');
const { cacheMiddleware, clearCache } = require('../middleware/cacheMiddleware');
const router = express.Router();

router.post('/', protect, alumniOrAdmin, validateCreateInternship, clearCache('cache:/api/internships*'), createInternship);
router.get('/', protect, cacheMiddleware(180), getAllInternships);
router.post('/:id/apply', protect, validateObjectId, clearCache('cache:/api/internships*'), applyForInternship);

module.exports = router;
