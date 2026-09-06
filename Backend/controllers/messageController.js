const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const { AppError } = require('../middleware/errorMiddleware');
const { createNotification } = require('./notificationController');

// Send a message — saves to DB and emits via Socket.io
exports.sendMessage = async (req, res, next) => {
  try {
    const { receiverId, content, messageType = 'text' } = req.body;
    const senderId = req.user._id;

    // Validate receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return next(new AppError('Receiver not found.', 404));
    }

    // Cannot message yourself
    if (senderId.toString() === receiverId) {
      return next(new AppError('You cannot send a message to yourself.', 400));
    }

    // Find or create conversation
    const conversation = await Conversation.findOrCreate(senderId, receiverId);

    // Create the message
    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      conversation: conversation._id,
      content,
      messageType,
    });

    // Update conversation with last message info
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();

    // Increment unread count for receiver
    const currentCount = conversation.unreadCount.get(receiverId.toString()) || 0;
    conversation.unreadCount.set(receiverId.toString(), currentCount + 1);
    await conversation.save();

    // Populate sender info for response
    await message.populate('sender', 'name profileImage');

    // Emit via Socket.io (getIO is set in server.js)
    const io = req.app.get('io');
    if (io) {
      io.to(receiverId.toString()).emit('receiveMessage', {
        message,
        conversationId: conversation._id,
      });
    }

    // Create notification for receiver
    await createNotification({
      recipient: receiverId,
      sender: senderId,
      type: 'message',
      title: `New message from ${req.user.name}`,
      message: content.length > 50 ? content.substring(0, 50) + '...' : content,
      link: `/chat`,
      io,
    });

    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
};

// Get all conversations for the logged-in user
exports.getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate('participants', 'name profileImage role designation company')
      .populate('lastMessage', 'content messageType createdAt')
      .sort({ lastMessageAt: -1 });

    // Add unread count for current user to each conversation
    const conversationsWithUnread = conversations.map((conv) => {
      const unread = conv.unreadCount.get(req.user._id.toString()) || 0;
      return {
        ...conv.toObject(),
        myUnreadCount: unread,
      };
    });

    res.json(conversationsWithUnread);
  } catch (error) {
    next(error);
  }
};

// Get paginated messages for a specific conversation
exports.getConversationMessages = async (req, res, next) => {
  try {
    const { id: conversationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;

    // Verify the logged-in user is a participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return next(new AppError('Conversation not found or access denied.', 404));
    }

    const messages = await Message.find({
      conversation: conversationId,
      isDeleted: false,
    })
      .populate('sender', 'name profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Message.countDocuments({
      conversation: conversationId,
      isDeleted: false,
    });

    res.json({
      messages: messages.reverse(), // Return in chronological order
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

// Mark all messages in a conversation as read
exports.markAsRead = async (req, res, next) => {
  try {
    const { id: conversationId } = req.params;
    const userId = req.user._id;

    // Verify user is a participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conversation) {
      return next(new AppError('Conversation not found.', 404));
    }

    // Mark all unread messages sent to this user as read
    const now = new Date();
    await Message.updateMany(
      {
        conversation: conversationId,
        receiver: userId,
        readAt: null,
      },
      { readAt: now }
    );

    // Reset unread count for this user
    conversation.unreadCount.set(userId.toString(), 0);
    await conversation.save();

    // Notify sender via Socket.io that messages were read
    const io = req.app.get('io');
    if (io) {
      io.to(conversationId.toString()).emit('messagesRead', {
        conversationId,
        readBy: userId,
        readAt: now,
      });
    }

    res.json({ message: 'Messages marked as read.' });
  } catch (error) {
    next(error);
  }
};
