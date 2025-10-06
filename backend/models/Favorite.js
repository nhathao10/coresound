const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  song: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song',
    required: false
  },
  album: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Album',
    required: false
  },
  type: {
    type: String,
    enum: ['song', 'album'],
    required: true
  }
}, {
  timestamps: true
});

// Index để tránh duplicate favorites
favoriteSchema.index({ user: 1, song: 1 }, { 
  unique: true, 
  partialFilterExpression: { song: { $exists: true } }
});
favoriteSchema.index({ user: 1, album: 1 }, { 
  unique: true, 
  partialFilterExpression: { album: { $exists: true } }
});

// Index để tối ưu query
favoriteSchema.index({ user: 1, type: 1 });

module.exports = mongoose.model('Favorite', favoriteSchema);
