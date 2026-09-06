const express = require('express');
const { createInternship, getAllInternships, applyForInternship } = require('../controllers/internshipController');
const { protect } = require('../middleware/authMiddleware');
const { alumniOrAdmin } = require('../middleware/roleMiddleware');
const { validateCreateInternship, validateObjectId } = require('../middleware/validationMiddleware');
const router = express.Router();

router.post('/', protect, alumniOrAdmin, validateCreateInternship, createInternship);
router.get('/', protect, getAllInternships);
router.post('/:id/apply', protect, validateObjectId, applyForInternship);

module.exports = router;
