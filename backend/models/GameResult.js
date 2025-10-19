const mongoose = require('mongoose');

const gameResultSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  dailySong: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'DailySong', 
    required: true 
  },
  isCorrect: { 
    type: Boolean, 
    required: true 
  },
  timeSpent: { 
    type: Number, 
    required: true 
  }, // seconds
  hintsUsed: { 
    type: Number, 
    default: 0 
  },
  score: { 
    type: Number, 
    default: 0 
  },
  roundNumber: {
    type: Number,
    default: 1,
    min: 1,
    max: 3
  }, // Track which round (1, 2, or 3)
  completedAllRounds: {
    type: Boolean,
    default: false
  }, // True when user completes all 3 rounds
  submittedAt: { 
    type: Date, 
    default: Date.now 
  }
}, { 
  timestamps: true 
});

// Index for user queries
gameResultSchema.index({ user: 1, submittedAt: -1 });
gameResultSchema.index({ dailySong: 1 });

module.exports = mongoose.model('GameResult', gameResultSchema);

