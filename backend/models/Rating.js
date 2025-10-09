const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  album: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Album',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure one rating per user per album
ratingSchema.index({ album: 1, user: 1 }, { unique: true });
ratingSchema.index({ album: 1, rating: 1 });

module.exports = mongoose.model('Rating', ratingSchema);

