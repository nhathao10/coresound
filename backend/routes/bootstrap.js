const express = require('express');
const router = express.Router();
const Song = require('../models/Song');
const Album = require('../models/Album');
const Artist = require('../models/Artist');
const Genre = require('../models/Genre');
const CuratedPlaylist = require('../models/CuratedPlaylist');
const Podcast = require('../models/Podcast');

// @route   GET /api/bootstrap
// @desc    Get all initial data for the app in one request
// @access  Public
router.get('/', async (req, res) => {
  try {
    // Run all queries in parallel for maximum speed
    const [songs, albums, genres, artists, curatedPlaylists, podcasts] = await Promise.all([
      // Get all songs (limit logic can be added if total songs are too many)
      Song.find()
        .populate('album', 'name cover')
        .populate('genres', 'name')
        .populate('region', 'name')
        .lean(),
      
      // Get all albums
      Album.find()
        .populate('genres', 'name')
        .sort({ plays: -1, createdAt: -1 })
        .lean(),
      
      // Get all genres
      Genre.find().sort({ name: 1 }).lean(),
      
      // Get all artists
      Artist.find().sort({ name: 1 }).lean(),
      
      // Get curated playlists
      CuratedPlaylist.find({ isPublic: true })
        .populate('songs', 'title artist cover url')
        .sort({ updatedAt: -1 })
        .lean(),
      
      // Get podcasts
      Podcast.find().sort({ createdAt: -1 }).lean()
    ]);

    res.json({
      songs,
      albums,
      genres,
      artists,
      curatedPlaylists,
      podcasts
    });
  } catch (error) {
    console.error('Bootstrap error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ khi tải dữ liệu khởi tạo' });
  }
});

module.exports = router;
