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
const router = express.Router();

// ALL admin routes — must be authenticated AND have admin role
router.use(protect, adminOnly);

router.get('/stats', getDashboardStats);
router.get('/analytics', getSystemAnalytics);
router.get('/users', getAllUsers);
router.get('/users/:id', validateObjectId, getUserById);
router.put('/users/:id/role', validateObjectId, updateUserRole);
router.delete('/users/:id', validateObjectId, deleteUser);

module.exports = router;
