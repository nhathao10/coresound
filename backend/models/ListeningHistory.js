const mongoose = require('mongoose');

const listeningHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  song: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song',
    required: true
  },
  playedAt: {
    type: Date,
    default: Date.now
  },
  duration: {
    type: Number, // Duration listened in seconds
    default: 0
  },
  completed: {
    type: Boolean,
    default: false // Whether the song was played to completion
  }
});

// Index for better performance
listeningHistorySchema.index({ user: 1, playedAt: -1 });
listeningHistorySchema.index({ user: 1, song: 1, playedAt: -1 });

// Compound index to prevent duplicate entries for the same user and song at the same time
listeningHistorySchema.index({ user: 1, song: 1, playedAt: 1 }, { unique: true });

module.exports = mongoose.model('ListeningHistory', listeningHistorySchema);


