const mongoose = require('mongoose');

const curatedPlaylistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  cover: {
    type: String,
    default: null
  },
  songs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song'
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual for song count
curatedPlaylistSchema.virtual('songCount').get(function() {
  return this.songs.length;
});

// Update the updatedAt field before saving
curatedPlaylistSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better performance
curatedPlaylistSchema.index({ isPublic: 1, createdAt: -1 });
curatedPlaylistSchema.index({ createdBy: 1, createdAt: -1 });

module.exports = mongoose.model('CuratedPlaylist', curatedPlaylistSchema);
