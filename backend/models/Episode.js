const mongoose = require('mongoose');

const episodeSchema = new mongoose.Schema({
  podcast: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Podcast',
    required: true
  },
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
  audioUrl: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true // Duration in seconds
  },
  fileSize: {
    type: Number, // File size in bytes
    default: 0
  },
  publishDate: {
    type: Date,
    default: Date.now
  },
  episodeNumber: {
    type: Number,
    required: true
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  plays: {
    type: Number,
    default: 0
  },
  downloads: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  thumbnail: {
    type: String,
    default: null
  },
  transcript: {
    type: String,
    default: null
  },
  showNotes: {
    type: String,
    default: null
  },
  guests: [{
    name: String,
    role: String,
    socialMedia: String
  }],
  tags: [{
    type: String,
    trim: true
  }],
  isExplicit: {
    type: Boolean,
    default: false
  },
  season: {
    type: Number,
    default: 1
  },
  episodeType: {
    type: String,
    enum: ['full', 'trailer', 'bonus'],
    default: 'full'
  }
}, {
  timestamps: true
});

// Index for better search performance
episodeSchema.index({ podcast: 1, episodeNumber: 1 });
episodeSchema.index({ title: 'text', description: 'text' });
episodeSchema.index({ publishDate: -1 });
episodeSchema.index({ plays: -1 });
episodeSchema.index({ isPublished: 1 });
episodeSchema.index({ podcast: 1, isPublished: 1, publishDate: -1 });

// Virtual for formatted duration
episodeSchema.virtual('formattedDuration').get(function() {
  const hours = Math.floor(this.duration / 3600);
  const minutes = Math.floor((this.duration % 3600) / 60);
  const seconds = this.duration % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
});

// Virtual for formatted file size
episodeSchema.virtual('formattedFileSize').get(function() {
  const bytes = this.fileSize;
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Method to increment plays
episodeSchema.methods.incrementPlays = async function() {
  this.plays += 1;
  await this.save();
  
  // Update podcast total plays
  const Podcast = mongoose.model('Podcast');
  await Podcast.findByIdAndUpdate(this.podcast, {
    $inc: { totalPlays: 1 }
  });
};

// Method to increment downloads
episodeSchema.methods.incrementDownloads = async function() {
  this.downloads += 1;
  await this.save();
};

// Pre-save middleware to update podcast duration
episodeSchema.pre('save', async function(next) {
  if (this.isModified('duration') || this.isNew) {
    try {
      const Podcast = mongoose.model('Podcast');
      const podcast = await Podcast.findById(this.podcast);
      if (podcast) {
        await podcast.updateDuration();
      }
    } catch (error) {
      console.error('Error updating podcast duration:', error);
    }
  }
  next();
});

module.exports = mongoose.model('Episode', episodeSchema);
