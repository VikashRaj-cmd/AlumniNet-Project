const express = require('express');
const { getProfile, getAllAlumni, updateProfile, getStats } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authenticatedUsers } = require('../middleware/roleMiddleware');
const { validateUpdateProfile } = require('../middleware/validationMiddleware');
const router = express.Router();

router.get('/profile', protect, getProfile);
router.get('/alumni', protect, getAllAlumni);
router.get('/stats', protect, getStats);
router.put('/profile', protect, validateUpdateProfile, updateProfile);

module.exports = router;
