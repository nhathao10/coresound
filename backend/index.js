const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

// Import scheduler
const { scheduleWeeklyReset, checkAndResetIfNeeded } = require('./scheduler/weeklyReset');

// Kết nối MongoDB
const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/coresound';
mongoose.connect(mongoURI, {
  dbName: 'coresound',
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(async () => {
    console.log('MongoDB connected!');
    
    // Fix DailySong indexes on startup (silent in production)
    try {
      const db = mongoose.connection.db;
      const collection = db.collection('dailysongs');
      
      // Get current indexes
      const indexes = await collection.indexes();
      
      // Drop problematic date_1 index if it exists
      const hasDateIndex = indexes.some(idx => idx.name === 'date_1');
      let needsClear = false;
      
      if (hasDateIndex) {
        await collection.dropIndex('date_1');
        needsClear = true;
      }
      
      // Ensure compound index exists
      const hasCompoundIndex = indexes.some(idx => 
        idx.name === 'date_1_sequence_1' || 
        idx.name === 'date_sequence_compound'
      );
      if (!hasCompoundIndex) {
        await collection.createIndex(
          { date: 1, sequence: 1 },
          { unique: true, name: 'date_sequence_compound' }
        );
        needsClear = true;
      }
      
      // Only clear data if we fixed indexes
      if (needsClear) {
        await collection.deleteMany({});
      } else {
        // Normal startup - clean up old dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        await collection.deleteMany({ date: { $lt: today } });
      }
    } catch (err) {
      console.error('[Index Fix] Error:', err.message);
    }
    
    // Initialize weekly reset scheduler
    try {
      await checkAndResetIfNeeded(); // Kiểm tra và reset nếu cần khi khởi động
      scheduleWeeklyReset(); // Lên lịch reset tự động
    } catch (err) {
      console.error('[Weekly Reset] Initialization error:', err.message);
    }
  })
  .catch(err => console.error('MongoDB connection error:', err));

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5000;

// Import routes
const songsRoute = require('./routes/songs');
const uploadRoute = require('./routes/upload'); 
const albumsRoute = require('./routes/albums');
const genresRoute = require('./routes/genres');
const regionsRoute = require('./routes/regions');
const artistsRoute = require('./routes/artists');
const authRoute = require('./routes/auth');
const usersRoute = require('./routes/users');
const profileRoute = require('./routes/profile');
const premiumRoute = require('./routes/premium');
const favoritesRoute = require('./routes/favorites');
const historyRoute = require('./routes/history');
const notificationsRoute = require('./routes/notifications');
const commentsRoute = require('./routes/comments');
const ratingsRoute = require('./routes/ratings');
const statisticsRoute = require('./routes/statistics');
const podcastsRoute = require('./routes/podcasts');
const dailyGameRoute = require('./routes/dailyGame');
const bootstrapRoute = require('./routes/bootstrap');

app.get('/', (req, res) => {
  res.send('CoreSound backend is running!');
});

// API trả về danh sách bài hát
app.use('/api/songs', songsRoute);

// API albums
app.use('/api/albums', albumsRoute);

// API genres
app.use('/api/genres', genresRoute);

// API regions
app.use('/api/regions', regionsRoute);

// API artists
app.use('/api/artists', artistsRoute);

// API auth
app.use('/api/auth', authRoute);

// API users (admin only)
app.use('/api/users', usersRoute);

// API profile
app.use('/api/profile', profileRoute);

// API premium
app.use('/api/premium', premiumRoute);

// API favorites
app.use('/api/favorites', favoritesRoute);

// API user playlists (user playlists - requires authentication)
const userPlaylistsRoute = require('./routes/userPlaylists');
app.use('/api/user-playlists', userPlaylistsRoute);

// API curated playlists (public curated playlists)
const curatedPlaylistsRoute = require('./routes/curatedPlaylists');
app.use('/api/curated-playlists', curatedPlaylistsRoute);

// API admin curated playlists (admin management)
const adminCuratedPlaylistsRoute = require('./routes/admin/curatedPlaylists');
app.use('/api/admin/curated-playlists', adminCuratedPlaylistsRoute);

// API listening history
app.use('/api/history', historyRoute);

// API notifications
app.use('/api/notifications', notificationsRoute);

// API comments and ratings
app.use('/api/albums', commentsRoute);
app.use('/api/albums', ratingsRoute);

// API statistics (admin only)
app.use('/api/statistics', statisticsRoute);

// API podcasts
app.use('/api/podcasts', podcastsRoute);

// API daily game
app.use('/api', dailyGameRoute);

// API bootstrap (combined initial data)
app.use('/api/bootstrap', bootstrapRoute);

// API upload (cover & song)
app.use('/api', uploadRoute);

// Phục vụ file tĩnh (ảnh + mp3)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 404 handler to ensure JSON for unknown routes
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler to always return JSON instead of HTML error pages
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
