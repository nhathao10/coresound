const mongoose = require('mongoose');

const dailySongSchema = new mongoose.Schema({
  date: { 
    type: Date, 
    required: true, 
    unique: true,
    index: true
  },
  song: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Song', 
    required: true 
  },
  // Optional order index for multi-song per day (1..N)
  sequence: {
    type: Number,
    default: 1,
    index: true
  },
  startTime: { 
    type: Number, 
    required: true 
  }, // seconds
  duration: { 
    type: Number, 
    default: 30 
  }, // seconds
  hints: {
    genre: String,
    year: Number,
    popularity: String
  },
  totalPlayers: { 
    type: Number, 
    default: 0 
  },
  correctAnswers: { 
    type: Number, 
    default: 0 
  },
  averageScore: {
    type: Number,
    default: 0
  }
}, { 
  timestamps: true 
});

// Index for date queries
dailySongSchema.index({ date: 1 });

module.exports = mongoose.model('DailySong', dailySongSchema);

