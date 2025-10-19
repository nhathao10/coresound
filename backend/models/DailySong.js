const mongoose = require('mongoose');

const dailySongSchema = new mongoose.Schema({
  date: { 
    type: Date, 
    required: true
    // Removed index: true to avoid single-field unique constraint
  },
  song: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Song', 
    required: true 
  },
  // Optional order index for multi-song per day (1..N)
  sequence: {
    type: Number,
    default: 1
    // Removed index: true, will use compound index instead
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
  timestamps: true,
  autoIndex: false // Disable auto index creation to prevent conflicts
});

// Compound index for date and sequence to ensure unique combination
dailySongSchema.index({ date: 1, sequence: 1 }, { unique: true });

module.exports = mongoose.model('DailySong', dailySongSchema);

