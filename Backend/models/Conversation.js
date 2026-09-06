const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    // Track unread count per user: { userId: count }
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

// Index for fetching user's conversations quickly
conversationSchema.index({ participants: 1, lastMessageAt: -1 });

// Static: find or create a conversation between two users
conversationSchema.statics.findOrCreate = async function (user1Id, user2Id) {
  let conversation = await this.findOne({
    participants: { $all: [user1Id, user2Id] },
  });

  if (!conversation) {
    conversation = await this.create({
      participants: [user1Id, user2Id],
      unreadCount: {
        [user1Id.toString()]: 0,
        [user2Id.toString()]: 0,
      },
    });
  }

  return conversation;
};

module.exports = mongoose.model('Conversation', conversationSchema);
