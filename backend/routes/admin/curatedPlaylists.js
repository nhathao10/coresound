const express = require('express');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const CuratedPlaylist = require('../../models/CuratedPlaylist');
const Song = require('../../models/Song');
const { protect, admin } = require('../../middleware/auth');

const router = express.Router();

// Configure multer for playlist cover uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/playlist_covers'));
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

// @route   GET /api/admin/curated-playlists
// @desc    Get all curated playlists (admin only)
// @access  Admin
router.get('/', protect, admin, async (req, res) => {
  try {
    const playlists = await CuratedPlaylist.find({})
      .populate('songs', 'title artist cover url')
      .sort({ updatedAt: -1 })
      .lean();
    
    res.json(playlists);
  } catch (error) {
    console.error('Get admin curated playlists error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// @route   GET /api/admin/curated-playlists/:id
// @desc    Get curated playlist by ID (admin only)
// @access  Admin
router.get('/:id', protect, admin, async (req, res) => {
  try {
    const playlist = await CuratedPlaylist.findById(req.params.id)
      .populate('songs', 'title artist cover url')
      .lean();

    if (!playlist) {
      return res.status(404).json({ error: 'Không tìm thấy playlist' });
    }

    res.json(playlist);
  } catch (error) {
    console.error('Get admin curated playlist error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// @route   POST /api/admin/curated-playlists
// @desc    Create new curated playlist (admin only)
// @access  Admin
router.post('/', protect, admin, upload.single('cover'), async (req, res) => {
  try {
    const { name, description, isPublic, songs } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Tên playlist không được để trống' });
    }

    const playlistData = {
      name: name.trim(),
      description: description?.trim() || '',
      isPublic: isPublic === 'true' || isPublic === true,
      createdBy: req.user?._id || new mongoose.Types.ObjectId() // Admin who created it
    };

    if (req.file) {
      playlistData.cover = `/uploads/playlist_covers/${req.file.filename}`;
    }

    // Parse songs if provided
    let songIds = [];
    if (songs) {
      try {
        songIds = Array.isArray(songs) ? songs : JSON.parse(songs);
      } catch (e) {
        // If parsing fails, treat as single song ID
        songIds = [songs];
      }
    }
    playlistData.songs = songIds;

    const playlist = new CuratedPlaylist(playlistData);
    await playlist.save();

    // Populate songs for response
    await playlist.populate('songs', 'title artist cover url');

    res.status(201).json(playlist);
  } catch (error) {
    console.error('Create admin curated playlist error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// @route   PUT /api/admin/curated-playlists/:id
// @desc    Update curated playlist (admin only)
// @access  Admin
router.put('/:id', protect, admin, upload.single('cover'), async (req, res) => {
  try {
    console.log('PUT /api/admin/curated-playlists/:id called');
    console.log('req.body:', req.body);
    console.log('req.file:', req.file);
    
    const { name, description, isPublic, songs } = req.body;
    
    const playlist = await CuratedPlaylist.findById(req.params.id);

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
      playlist.isPublic = isPublic === 'true' || isPublic === true;
    }

    if (songs !== undefined) {
      // Parse songs if provided
      let songIds = [];
      if (songs) {
        try {
          songIds = Array.isArray(songs) ? songs : JSON.parse(songs);
        } catch (e) {
          // If parsing fails, treat as single song ID
          songIds = [songs];
        }
      }
      playlist.songs = songIds;
    }

    if (req.file) {
      console.log('File uploaded:', req.file.filename);
      // Delete old cover if exists
      if (playlist.cover) {
        const fs = require('fs');
        const oldCoverPath = path.join(__dirname, '../../', playlist.cover);
        if (fs.existsSync(oldCoverPath)) {
          fs.unlinkSync(oldCoverPath);
          console.log('Deleted old cover:', oldCoverPath);
        }
      }
      playlist.cover = `/uploads/playlist_covers/${req.file.filename}`;
      console.log('New cover path:', playlist.cover);
    }

    await playlist.save();

    // Populate songs for response
    await playlist.populate('songs', 'title artist cover url');

    res.json(playlist);
  } catch (error) {
    console.error('Update admin curated playlist error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// @route   DELETE /api/admin/curated-playlists/:id
// @desc    Delete curated playlist (admin only)
// @access  Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const playlist = await CuratedPlaylist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({ error: 'Không tìm thấy playlist' });
    }

    // Delete cover file if exists
    if (playlist.cover) {
      const fs = require('fs');
      const coverPath = path.join(__dirname, '../../', playlist.cover);
      if (fs.existsSync(coverPath)) {
        fs.unlinkSync(coverPath);
      }
    }

    await CuratedPlaylist.findByIdAndDelete(req.params.id);

    res.json({ message: 'Xóa playlist thành công' });
  } catch (error) {
    console.error('Delete admin curated playlist error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

module.exports = router;
