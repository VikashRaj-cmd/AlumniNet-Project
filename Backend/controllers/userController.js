const User = require('../models/User');
const { AppError } = require('../middleware/errorMiddleware');

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return next(new AppError('User not found.', 404));
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

exports.getAllAlumni = async (req, res, next) => {
  try {
    const alumni = await User.find({ role: 'alumni' }).select('-password');
    res.json(alumni);
  } catch (error) {
    next(error);
  }
};

exports.getStats = async (req, res, next) => {
  try {
    const Event = require('../models/Event');
    const Internship = require('../models/Internship');
    const Mentor = require('../models/Mentor');
    const [alumniCount, eventsCount, jobsCount, mentorCount] = await Promise.all([
      User.countDocuments({ role: 'alumni' }),
      Event.countDocuments(),
      Internship.countDocuments(),
      Mentor.countDocuments(),
    ]);
    res.json({ alumniCount, eventsCount, jobsCount, mentorCount });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    // Prevent role/password changes via this route
    const { password, role, ...updateData } = req.body;

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      return next(new AppError('User not found.', 404));
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};
