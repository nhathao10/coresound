const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
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
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return !this.isCurated;
    }
  },
  isCurated: {
    type: Boolean,
    default: false
  },
  songs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song'
  }],
  isPublic: {
    type: Boolean,
    default: true
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
playlistSchema.virtual('songCount').get(function() {
  return this.songs.length;
});

// Update the updatedAt field before saving
playlistSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better performance
playlistSchema.index({ user: 1, createdAt: -1 });
playlistSchema.index({ isPublic: 1, createdAt: -1 });
playlistSchema.index({ isCurated: 1, isPublic: 1, createdAt: -1 });

module.exports = mongoose.model('Playlist', playlistSchema);

