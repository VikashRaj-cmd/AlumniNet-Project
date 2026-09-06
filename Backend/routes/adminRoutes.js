const express = require('express');
const {
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  getDashboardStats,
  getSystemAnalytics,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');
const { validateObjectId } = require('../middleware/validationMiddleware');
const { cacheMiddleware, clearCache } = require('../middleware/cacheMiddleware');
const router = express.Router();

// ALL admin routes — must be authenticated AND have admin role
router.use(protect, adminOnly);

router.get('/stats', cacheMiddleware(60), getDashboardStats);
router.get('/analytics', cacheMiddleware(300), getSystemAnalytics);
router.get('/users', getAllUsers);
router.get('/users/:id', validateObjectId, getUserById);
router.put('/users/:id/role', validateObjectId, clearCache(['cache:/api/admin*', 'cache:/api/alumni*']), updateUserRole);
router.delete('/users/:id', validateObjectId, clearCache(['cache:/api/admin*', 'cache:/api/alumni*']), deleteUser);

module.exports = router;
