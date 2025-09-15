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

const PORT = process.env.PORT || 5000;

// Import routes
const songsRoute = require('./routes/songs');
const uploadRoute = require('./routes/upload'); 
const albumsRoute = require('./routes/albums');
const genresRoute = require('./routes/genres');

app.get('/', (req, res) => {
  res.send('CoreSound backend is running!');
});

// API trả về danh sách bài hát
app.use('/api/songs', songsRoute);

// API albums
app.use('/api/albums', albumsRoute);

// API genres
app.use('/api/genres', genresRoute);

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
