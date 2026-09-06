const Internship = require('../models/Internship');
const { AppError } = require('../middleware/errorMiddleware');

exports.createInternship = async (req, res, next) => {
  try {
    const internship = await Internship.create({ ...req.body, postedBy: req.user._id });
    res.status(201).json(internship);
  } catch (error) {
    next(error);
  }
};

exports.getAllInternships = async (req, res, next) => {
  try {
    const internships = await Internship.find().populate('postedBy', 'name company');
    res.json(internships);
  } catch (error) {
    next(error);
  }
};

exports.applyForInternship = async (req, res, next) => {
  try {
    const internship = await Internship.findById(req.params.id);
    if (!internship) {
      return next(new AppError('Job/Internship not found.', 404));
    }
    if (internship.applicants.includes(req.user._id)) {
      return next(new AppError('You have already applied for this position.', 400));
    }
    internship.applicants.push(req.user._id);
    await internship.save();
    res.json(internship);
  } catch (error) {
    next(error);
  }
};
