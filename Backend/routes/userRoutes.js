const express = require('express');
const { getProfile, getAllAlumni, updateProfile, getStats } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authenticatedUsers } = require('../middleware/roleMiddleware');
const { validateUpdateProfile } = require('../middleware/validationMiddleware');
const { cacheMiddleware, clearCache } = require('../middleware/cacheMiddleware');
const router = express.Router();

router.get('/profile', protect, getProfile);
router.get('/alumni', protect, cacheMiddleware(300), getAllAlumni);
router.get('/stats', protect, cacheMiddleware(60), getStats);
router.put('/profile', protect, validateUpdateProfile, clearCache(['cache:/api/alumni*', 'cache:/api/users*']), updateProfile);

module.exports = router;
