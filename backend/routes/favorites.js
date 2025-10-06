const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Favorite = require('../models/Favorite');
const Song = require('../models/Song');
const Album = require('../models/Album');
const User = require('../models/User');

const JWT_SECRET = 'your-secret-key-change-in-production';

// Middleware to protect routes
const protect = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (!token) {
    return res.status(401).json({ error: 'Không được phép, không có token' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(decoded.userId).select('-password');
    
    if (!req.user) {
      return res.status(401).json({ error: 'Token không hợp lệ, người dùng không tồn tại' });
    }
    
    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    return res.status(401).json({ error: 'Không được phép, token không hợp lệ' });
  }
};

// @route   GET /api/favorites
// @desc    Get user's favorites
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { type } = req.query;
    
    let query = { user: req.user._id };
    if (type) {
      query.type = type;
    }
    
    const favorites = await Favorite.find(query)
      .populate('song', 'title artist album cover duration url')
      .populate('album', 'name artist cover releaseDate')
      .sort({ createdAt: -1 });
    
    res.json({
      favorites: favorites.map(fav => ({
        _id: fav._id,
        type: fav.type,
        item: fav.song || fav.album,
        createdAt: fav.createdAt
      }))
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// @route   POST /api/favorites
// @desc    Add item to favorites
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { type, itemId } = req.body;
    
    if (!type || !itemId) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
    }
    
    if (!['song', 'album'].includes(type)) {
      return res.status(400).json({ error: 'Loại không hợp lệ' });
    }
    
    // Check if item exists
    let item;
    if (type === 'song') {
      item = await Song.findById(itemId);
    } else if (type === 'album') {
      item = await Album.findById(itemId);
    }
    
    if (!item) {
      return res.status(404).json({ error: 'Không tìm thấy item' });
    }
    
    // Check if already favorited
    const existingFavorite = await Favorite.findOne({
      user: req.user._id,
      [type]: itemId
    });
    
    if (existingFavorite) {
      return res.status(400).json({ error: 'Đã có trong danh sách yêu thích' });
    }
    
    // Create favorite
    const favoriteData = {
      user: req.user._id,
      type: type,
      [type]: itemId
    };
    
    const favorite = new Favorite(favoriteData);
    await favorite.save();
    
    // Populate the favorite
    await favorite.populate('song', 'title artist album cover duration url');
    await favorite.populate('album', 'name artist cover releaseDate');
    
    res.status(201).json({
      message: 'Đã thêm vào danh sách yêu thích',
      favorite: {
        _id: favorite._id,
        type: favorite.type,
        item: favorite.song || favorite.album,
        createdAt: favorite.createdAt
      }
    });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// @route   DELETE /api/favorites/:id
// @desc    Remove item from favorites
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    
    const favorite = await Favorite.findOneAndDelete({
      _id: id,
      user: req.user._id
    });
    
    if (!favorite) {
      return res.status(404).json({ error: 'Không tìm thấy trong danh sách yêu thích' });
    }
    
    res.json({
      message: 'Đã xóa khỏi danh sách yêu thích'
    });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// @route   DELETE /api/favorites/item/:type/:itemId
// @desc    Remove item from favorites by type and itemId
// @access  Private
router.delete('/item/:type/:itemId', protect, async (req, res) => {
  try {
    const { type, itemId } = req.params;
    
    if (!['song', 'album'].includes(type)) {
      return res.status(400).json({ error: 'Loại không hợp lệ' });
    }
    
    const favorite = await Favorite.findOneAndDelete({
      user: req.user._id,
      type: type,
      [type]: itemId
    });
    
    if (!favorite) {
      return res.status(404).json({ error: 'Không tìm thấy trong danh sách yêu thích' });
    }
    
    res.json({
      message: 'Đã xóa khỏi danh sách yêu thích'
    });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// @route   GET /api/favorites/check/:type/:itemId
// @desc    Check if item is favorited
// @access  Private
router.get('/check/:type/:itemId', protect, async (req, res) => {
  try {
    const { type, itemId } = req.params;
    
    if (!['song', 'album'].includes(type)) {
      return res.status(400).json({ error: 'Loại không hợp lệ' });
    }
    
    const favorite = await Favorite.findOne({
      user: req.user._id,
      type: type,
      [type]: itemId
    });
    
    res.json({
      isFavorited: !!favorite,
      favoriteId: favorite ? favorite._id : null
    });
  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

module.exports = router;
