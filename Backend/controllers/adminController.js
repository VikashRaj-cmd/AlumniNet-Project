const User = require('../models/User');
const Event = require('../models/Event');
const Internship = require('../models/Internship');
const Mentor = require('../models/Mentor');
const Donation = require('../models/Donation');
const { AppError } = require('../middleware/errorMiddleware');

// Get all users with filters and pagination
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, department, batch, page = 1, limit = 20, q } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (role) filter.role = role;
    if (department) filter.department = { $regex: department, $options: 'i' };
    if (batch) filter.batch = batch;
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter).select('-password -resetPasswordToken -resetPasswordExpire').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    res.json({
      users,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

// Get a single user by ID
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password -resetPasswordToken -resetPasswordExpire');
    if (!user) return next(new AppError('User not found.', 404));
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// Update a user's role
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!['student', 'alumni', 'admin'].includes(role)) {
      return next(new AppError('Invalid role. Must be student, alumni, or admin.', 400));
    }

    // Prevent admin from changing their own role
    if (req.params.id === req.user._id.toString()) {
      return next(new AppError('You cannot change your own role.', 400));
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return next(new AppError('User not found.', 404));
    res.json({ message: `User role updated to ${role}.`, user });
  } catch (error) {
    next(error);
  }
};

// Delete a user
exports.deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return next(new AppError('You cannot delete your own account as admin.', 400));
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return next(new AppError('User not found.', 404));

    res.json({ message: 'User deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// Admin dashboard stats
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalAlumni,
      totalStudents,
      totalEvents,
      totalJobs,
      totalMentors,
      recentUsers,
      donationStats,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'alumni' }),
      User.countDocuments({ role: 'student' }),
      Event.countDocuments(),
      Internship.countDocuments(),
      Mentor.countDocuments(),
      User.find().select('name email role createdAt').sort({ createdAt: -1 }).limit(5),
      Donation.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
    ]);

    res.json({
      counts: {
        totalUsers,
        totalAlumni,
        totalStudents,
        totalEvents,
        totalJobs,
        totalMentors,
      },
      donations: donationStats[0] || { total: 0, count: 0 },
      recentUsers,
    });
  } catch (error) {
    next(error);
  }
};

// System analytics — user registrations over last 6 months
exports.getSystemAnalytics = async (req, res, next) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [registrationTrend, roleDistribution, departmentDistribution] = await Promise.all([
      // Monthly registration count for last 6 months
      User.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),

      // User count by role
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),

      // Alumni by department (top 8)
      User.aggregate([
        { $match: { role: 'alumni' } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
    ]);

    res.json({ registrationTrend, roleDistribution, departmentDistribution });
  } catch (error) {
    next(error);
  }
};
