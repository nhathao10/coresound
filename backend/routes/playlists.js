const express = require('express');
const multer = require('multer');
const path = require('path');
const Playlist = require('../models/Playlist');
const Song = require('../models/Song');
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

// @route   GET /api/playlists
// @desc    Get user's playlists
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const playlists = await Playlist.find({ user: req.user._id })
      .populate('songs', 'title artist cover url')
      .sort({ updatedAt: -1 })
      .lean();
    
    res.json(playlists);
  } catch (error) {
    console.error('Get playlists error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// @route   GET /api/playlists/:id/songs
// @desc    Get songs in playlist
// @access  Private
router.get('/:id/songs', protect, async (req, res) => {
  try {
    const playlist = await Playlist.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    }).populate('songs', 'title artist cover url album');

    if (!playlist) {
      return res.status(404).json({ error: 'Không tìm thấy playlist' });
    }

    res.json(playlist);
  } catch (error) {
    console.error('Get playlist songs error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// @route   GET /api/playlists/:id
// @desc    Get playlist by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const playlist = await Playlist.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    }).populate('songs', 'title artist cover url album');

    if (!playlist) {
      return res.status(404).json({ error: 'Không tìm thấy playlist' });
    }

    res.json(playlist);
  } catch (error) {
    console.error('Get playlist error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// @route   POST /api/playlists
// @desc    Create new playlist
// @access  Private
router.post('/', protect, upload.single('cover'), async (req, res) => {
  try {
    const { name, description, isPublic } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Tên playlist không được để trống' });
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

    const playlist = new Playlist(playlistData);
    await playlist.save();

    res.status(201).json({
      message: 'Tạo playlist thành công',
      playlist
    });
  } catch (error) {
    console.error('Create playlist error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// @route   PUT /api/playlists/:id
// @desc    Update playlist
// @access  Private
router.put('/:id', protect, upload.single('cover'), async (req, res) => {
  try {
    const { name, description, isPublic } = req.body;
    
    const playlist = await Playlist.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    });

    if (!playlist) {
      return res.status(404).json({ error: 'Không tìm thấy playlist' });
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
        const oldCoverPath = path.join(__dirname, '..', playlist.cover);
        if (fs.existsSync(oldCoverPath)) {
          fs.unlinkSync(oldCoverPath);
        }
      }
      playlist.cover = `/uploads/playlist_covers/${req.file.filename}`;
    }

    await playlist.save();

    res.json({
      message: 'Cập nhật playlist thành công',
      playlist
    });
  } catch (error) {
    console.error('Update playlist error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// @route   DELETE /api/playlists/:id
// @desc    Delete playlist
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const playlist = await Playlist.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    });

    if (!playlist) {
      return res.status(404).json({ error: 'Không tìm thấy playlist' });
    }

    // Delete cover file if exists
    if (playlist.cover) {
      const fs = require('fs');
      const coverPath = path.join(__dirname, '..', playlist.cover);
      if (fs.existsSync(coverPath)) {
        fs.unlinkSync(coverPath);
      }
    }

    await Playlist.findByIdAndDelete(req.params.id);

    res.json({ message: 'Xóa playlist thành công' });
  } catch (error) {
    console.error('Delete playlist error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// @route   POST /api/playlists/:id/songs
// @desc    Add song to playlist
// @access  Private
router.post('/:id/songs', protect, async (req, res) => {
  try {
    const { songId } = req.body;
    
    if (!songId) {
      return res.status(400).json({ error: 'Song ID không được để trống' });
    }

    const playlist = await Playlist.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    });

    if (!playlist) {
      return res.status(404).json({ error: 'Không tìm thấy playlist' });
    }

    // Check if song exists
    const song = await Song.findById(songId);
    if (!song) {
      return res.status(404).json({ error: 'Không tìm thấy bài hát' });
    }

    // Check if song is already in playlist
    if (playlist.songs.includes(songId)) {
      return res.status(400).json({ error: 'Bài hát đã có trong playlist' });
    }

    playlist.songs.push(songId);
    await playlist.save();

    res.json({
      message: 'Thêm bài hát vào playlist thành công',
      playlist
    });
  } catch (error) {
    console.error('Add song to playlist error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// @route   DELETE /api/playlists/:id/songs/:songId
// @desc    Remove song from playlist
// @access  Private
router.delete('/:id/songs/:songId', protect, async (req, res) => {
  try {
    const playlist = await Playlist.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    });

    if (!playlist) {
      return res.status(404).json({ error: 'Không tìm thấy playlist' });
    }

    playlist.songs = playlist.songs.filter(
      songId => songId.toString() !== req.params.songId
    );
    
    await playlist.save();

    res.json({
      message: 'Xóa bài hát khỏi playlist thành công',
      playlist
    });
  } catch (error) {
    console.error('Remove song from playlist error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

module.exports = router;
