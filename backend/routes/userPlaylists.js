const express = require('express');
const multer = require('multer');
const path = require('path');
const UserPlaylist = require('../models/UserPlaylist');
const Song = require('../models/Song');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

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

// @route   GET /api/user-playlists/stats
// @desc    Get user's playlist stats (count and limit)
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const playlistCount = await UserPlaylist.countDocuments({ user: req.user._id });
    const isPremium = user.isPremium && (!user.premiumExpiresAt || user.premiumExpiresAt > new Date());
    const MAX_FREE_PLAYLISTS = 2;
    
    res.json({
      count: playlistCount,
      limit: isPremium ? -1 : MAX_FREE_PLAYLISTS,
      canCreate: isPremium || playlistCount < MAX_FREE_PLAYLISTS,
      isPremium: isPremium
    });
  } catch (error) {
    console.error('Get playlist stats error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// @route   GET /api/user-playlists
// @desc    Get user's playlists
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const playlists = await UserPlaylist.find({ user: req.user._id })
      .populate('songs', 'title artist cover url')
      .sort({ updatedAt: -1 })
      .lean();
    
    res.json(playlists);
  } catch (error) {
    console.error('Get user playlists error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// @route   GET /api/user-playlists/:id/songs
// @desc    Get songs in user playlist
// @access  Private
router.get('/:id/songs', protect, async (req, res) => {
  try {
    const playlist = await UserPlaylist.findById(req.params.id)
      .populate('songs', 'title artist cover url')
      .populate('user', 'name')
      .lean();

    if (!playlist) {
      return res.status(404).json({ error: 'Không tìm thấy playlist' });
    }

    // Check if user owns this playlist
    if (playlist.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Không có quyền truy cập playlist này' });
    }
    
    // Rename 'user' to 'creator' for consistency with frontend
    playlist.creator = playlist.user;
    delete playlist.user;

    res.json(playlist);
  } catch (error) {
    console.error('Get user playlist songs error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// @route   POST /api/user-playlists
// @desc    Create new user playlist
// @access  Private
router.post('/', protect, upload.single('cover'), async (req, res) => {
  try {
    const { name, description, isPublic } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Tên playlist không được để trống' });
    }

    // Check playlist limit for free users
    const user = await User.findById(req.user._id);
    const isPremium = user.isPremium && (!user.premiumExpiresAt || user.premiumExpiresAt > new Date());
    
    if (!isPremium) {
      // Free users can only create 2 playlists
      const playlistCount = await UserPlaylist.countDocuments({ user: req.user._id });
      const MAX_FREE_PLAYLISTS = 2;
      
      if (playlistCount >= MAX_FREE_PLAYLISTS) {
        return res.status(403).json({ 
          error: 'Bạn đã đạt giới hạn playlist miễn phí',
          message: `Người dùng thường chỉ được tạo tối đa ${MAX_FREE_PLAYLISTS} playlist. Nâng cấp Premium để tạo không giới hạn!`,
          limit: MAX_FREE_PLAYLISTS,
          current: playlistCount,
          needsPremium: true
        });
      }
    }

    const playlistData = {
      name: name.trim(),
      description: description?.trim() || '',
      user: req.user._id,
      isPublic: isPublic === 'true'
    };

    if (req.file) {
      playlistData.cover = `/uploads/playlist_covers/${req.file.filename}`;
    }

    const playlist = new UserPlaylist(playlistData);
    await playlist.save();

    res.status(201).json({
      message: 'Tạo playlist thành công',
      playlist
    });
  } catch (error) {
    console.error('Create user playlist error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// @route   PUT /api/user-playlists/:id
// @desc    Update user playlist
// @access  Private
router.put('/:id', protect, upload.single('cover'), async (req, res) => {
  try {
    const { name, description, isPublic } = req.body;
    
    const playlist = await UserPlaylist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({ error: 'Không tìm thấy playlist' });
    }

    // Check if user owns this playlist
    if (playlist.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Không có quyền chỉnh sửa playlist này' });
    }

    if (name && name.trim().length > 0) {
      playlist.name = name.trim();
    }
    
    if (description !== undefined) {
      playlist.description = description.trim();
    }
    
    if (isPublic !== undefined) {
      playlist.isPublic = isPublic === 'true';
    }

    if (req.file) {
      // Delete old cover if exists
      if (playlist.cover) {
        const fs = require('fs');
        const oldCoverPath = path.join(__dirname, '../', playlist.cover);
        if (fs.existsSync(oldCoverPath)) {
          fs.unlinkSync(oldCoverPath);
        }
      }
      playlist.cover = `/uploads/playlist_covers/${req.file.filename}`;
    }

    await playlist.save();

    res.json(playlist);
  } catch (error) {
    console.error('Update user playlist error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// @route   DELETE /api/user-playlists/:id
// @desc    Delete user playlist
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const playlist = await UserPlaylist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({ error: 'Không tìm thấy playlist' });
    }

    // Check if user owns this playlist
    if (playlist.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Không có quyền xóa playlist này' });
    }

    // Delete cover file if exists
    if (playlist.cover) {
      const fs = require('fs');
      const coverPath = path.join(__dirname, '../', playlist.cover);
      if (fs.existsSync(coverPath)) {
        fs.unlinkSync(coverPath);
      }
    }

    await UserPlaylist.findByIdAndDelete(req.params.id);

    res.json({ message: 'Xóa playlist thành công' });
  } catch (error) {
    console.error('Delete user playlist error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// @route   POST /api/user-playlists/:id/songs/:songId
// @desc    Add song to user playlist
// @access  Private
router.post('/:id/songs/:songId', protect, async (req, res) => {
  try {
    const playlist = await UserPlaylist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({ error: 'Không tìm thấy playlist' });
    }

    // Check if user owns this playlist
    if (playlist.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Không có quyền thêm bài hát vào playlist này' });
    }

    // Check if song already exists in playlist
    if (playlist.songs.includes(req.params.songId)) {
      return res.status(400).json({ error: 'Bài hát đã có trong playlist' });
    }

    playlist.songs.push(req.params.songId);
    await playlist.save();

    res.json({ message: 'Thêm bài hát vào playlist thành công' });
  } catch (error) {
    console.error('Add song to user playlist error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// @route   DELETE /api/user-playlists/:id/songs/:songId
// @desc    Remove song from user playlist
// @access  Private
router.delete('/:id/songs/:songId', protect, async (req, res) => {
  try {
    const playlist = await UserPlaylist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({ error: 'Không tìm thấy playlist' });
    }

    // Check if user owns this playlist
    if (playlist.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Không có quyền xóa bài hát khỏi playlist này' });
    }

    playlist.songs = playlist.songs.filter(songId => songId.toString() !== req.params.songId);
    await playlist.save();

    res.json({ message: 'Xóa bài hát khỏi playlist thành công' });
  } catch (error) {
    console.error('Remove song from user playlist error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

module.exports = router;
