const Notification = require('../models/Notification');
const { AppError } = require('../middleware/errorMiddleware');

// ─── UTILITY: Create & emit a notification (used internally by other controllers) ─────
const createNotification = async ({ recipient, sender, type, title, message, link, io }) => {
  try {
    const notification = await Notification.create({
      recipient,
      sender,
      type,
      title,
      message,
      link: link || '/dashboard',
    });

    await notification.populate('sender', 'name profileImage');

    // Emit real-time notification via Socket.io
    if (io) {
      io.to(recipient.toString()).emit('newNotification', notification);
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error.message);
  }
};

// Get logged-in user's notifications (paginated)
const getNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'name profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments({ recipient: req.user._id });

    res.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get unread notification count
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });
    res.json({ unreadCount: count });
  } catch (error) {
    next(error);
  }
};

// Mark a single notification as read
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return next(new AppError('Notification not found.', 404));
    }

    res.json(notification);
  } catch (error) {
    next(error);
  }
};

// Mark ALL notifications as read
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true }
    );
    res.json({ message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
};

// Delete a single notification
const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      return next(new AppError('Notification not found.', 404));
    }

    res.json({ message: 'Notification deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createNotification,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
