const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

// Kết nối MongoDB
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/coresound';
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected!'))
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
