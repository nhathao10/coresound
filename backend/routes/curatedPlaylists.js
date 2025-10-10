const express = require('express');
const multer = require('multer');
const path = require('path');
const CuratedPlaylist = require('../models/CuratedPlaylist');
const Song = require('../models/Song');

const router = express.Router();

// Configure multer for playlist cover uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/playlist_covers'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// @route   GET /api/curated-playlists
// @desc    Get all curated playlists (public)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const playlists = await CuratedPlaylist.find({ isPublic: true })
      .populate('songs', 'title artist cover url')
      .sort({ updatedAt: -1 })
      .lean();
    
    res.json(playlists);
  } catch (error) {
    console.error('Get curated playlists error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// @route   GET /api/curated-playlists/:id
// @desc    Get curated playlist by ID (public)
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const playlist = await CuratedPlaylist.findById(req.params.id)
      .populate('songs', 'title artist cover url')
      .lean();

    if (!playlist) {
      return res.status(404).json({ error: 'Không tìm thấy playlist' });
    }

    if (!playlist.isPublic) {
      return res.status(403).json({ error: 'Playlist không công khai' });
    }

    res.json(playlist);
  } catch (error) {
    console.error('Get curated playlist error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

module.exports = router;
