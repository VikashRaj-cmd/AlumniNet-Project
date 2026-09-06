const Mentor = require('../models/Mentor');

exports.getAllMentors = async (req, res, next) => {
  try {
    const mentors = await Mentor.find();
    res.json(mentors);
  } catch (error) {
    next(error);
  }
};
