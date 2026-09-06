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

exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('Please select an image file to upload.', 400));
    }

    const { uploadToCloud } = require('../config/storage');
    const imageUrl = await uploadToCloud(req.file.path, 'alumninet/avatars');

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profileImage: imageUrl },
      { new: true }
    ).select('-password');

    res.json({ message: 'Profile avatar updated successfully.', profileImage: imageUrl, user });
  } catch (error) {
    next(error);
  }
};

exports.uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('Please select a PDF or Word file to upload.', 400));
    }

    const { uploadToCloud } = require('../config/storage');
    const resumeUrl = await uploadToCloud(req.file.path, 'alumninet/resumes');

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { resume: resumeUrl },
      { new: true }
    ).select('-password');

    res.json({ message: 'Resume uploaded successfully.', resume: resumeUrl, user });
  } catch (error) {
    next(error);
  }
};
