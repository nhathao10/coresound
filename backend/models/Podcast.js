const mongoose = require('mongoose');

const podcastSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  host: {
    type: String,
    required: true,
    trim: true
  },
  hosts: [{
    type: String,
    trim: true
  }],
  cover: {
    type: String,
    default: null
  },
  category: {
    type: String,
    required: true,
    enum: ['Tâm trạng', 'Tình yêu', 'Chữa lành', 'Giáo Dục'],
    default: 'Tâm trạng'
  },
  // language: {
  //   type: String,
  //   default: 'vi',
  //   trim: true
  // },
  duration: {
    type: Number,
    default: 0 // Total duration in seconds
  },
  // For single audio podcasts (no episodes)
  audioUrl: {
    type: String,
    default: null
  },
  // For multi-episode podcasts
  episodes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Episode'
  }],
  // Podcast type: 'single' (one audio file) or 'series' (multiple episodes)
  type: {
    type: String,
    enum: ['single', 'series'],
    default: 'series'
  },
  subscribers: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalPlays: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  website: {
    type: String,
    trim: true
  },
  socialLinks: {
    twitter: String,
    facebook: String,
    instagram: String,
    youtube: String
  }
}, {
  timestamps: true
});

// Index for better search performance
podcastSchema.index({ title: 'text', description: 'text', host: 'text' }, { default_language: 'none' });
podcastSchema.index({ category: 1 });
podcastSchema.index({ isActive: 1, isFeatured: 1 });
podcastSchema.index({ subscribers: -1 });
podcastSchema.index({ totalPlays: -1 });

// Virtual for episode count
podcastSchema.virtual('episodeCount').get(function() {
  return this.episodes ? this.episodes.length : 0;
});

// Method to update total duration
podcastSchema.methods.updateDuration = async function() {
  const Episode = mongoose.model('Episode');
  const episodes = await Episode.find({ podcast: this._id });
  this.duration = episodes.reduce((total, episode) => total + (episode.duration || 0), 0);
  await this.save();
};

// Method to update total plays
podcastSchema.methods.updateTotalPlays = async function() {
  const Episode = mongoose.model('Episode');
  const episodes = await Episode.find({ podcast: this._id });
  this.totalPlays = episodes.reduce((total, episode) => total + (episode.plays || 0), 0);
  await this.save();
};

module.exports = mongoose.model('Podcast', podcastSchema);
