const express = require('express');
const Artist = require('../models/Artist');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/artists
// @desc    Get all artists
// @access  Public
router.get('/', async (req, res) => {
  try {
    const artists = await Artist.find().sort({ name: 1 });
    res.json(artists);
  } catch (error) {
    console.error('Get artists error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// @route   GET /api/artists/followed
// @desc    Get user's followed artists
// @access  Private
router.get('/followed', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('followedArtists');
    res.json(user.followedArtists || []);
  } catch (error) {
    console.error('Get followed artists error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// @route   GET /api/artists/:id
// @desc    Get artist by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);
    if (!artist) {
      return res.status(404).json({ error: 'Không tìm thấy nghệ sĩ' });
    }
    res.json(artist);
  } catch (error) {
    console.error('Get artist error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// @route   POST /api/artists/:id/follow
// @desc    Follow an artist
// @access  Private
router.post('/:id/follow', protect, async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);
    if (!artist) {
      return res.status(404).json({ error: 'Không tìm thấy nghệ sĩ' });
    }

    const User = require('../models/User');
    const user = await User.findById(req.user._id);
    
    if (!user.followedArtists.includes(req.params.id)) {
      user.followedArtists.push(req.params.id);
      await user.save();
    }

    res.json({ message: 'Đã theo dõi nghệ sĩ' });
  } catch (error) {
    console.error('Follow artist error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// @route   POST /api/artists/:id/unfollow
// @desc    Unfollow an artist
// @access  Private
router.post('/:id/unfollow', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    user.followedArtists = user.followedArtists.filter(
      artistId => artistId.toString() !== req.params.id
    );
    await user.save();

    res.json({ message: 'Đã bỏ theo dõi nghệ sĩ' });
  } catch (error) {
    console.error('Unfollow artist error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// @route   GET /api/artists/:id/albums
// @desc    Get artist's albums
// @access  Public
router.get('/:id/albums', async (req, res) => {
  try {
    const Album = require('../models/Album');
    const albums = await Album.find({ artist: req.params.id })
      .populate('artist', 'name')
      .sort({ releaseDate: -1 });
    
    res.json(albums);
  } catch (error) {
    console.error('Get artist albums error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

module.exports = router;