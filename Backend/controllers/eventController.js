const Event = require('../models/Event');
const { AppError } = require('../middleware/errorMiddleware');

exports.createEvent = async (req, res, next) => {
  try {
    const event = await Event.create({ ...req.body, organizer: req.user._id });
    res.status(201).json(event);
  } catch (error) {
    next(error);
  }
};

exports.getAllEvents = async (req, res, next) => {
  try {
    const events = await Event.find().populate('organizer', 'name email');
    res.json(events);
  } catch (error) {
    next(error);
  }
};

exports.registerForEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return next(new AppError('Event not found.', 404));
    }
    if (event.registeredUsers.includes(req.user._id)) {
      return next(new AppError('You are already registered for this event.', 400));
    }
    event.registeredUsers.push(req.user._id);
    await event.save();
    res.json(event);
  } catch (error) {
    next(error);
  }
};
