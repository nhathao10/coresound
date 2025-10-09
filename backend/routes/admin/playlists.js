const express = require('express');
const multer = require('multer');
const path = require('path');
const Playlist = require('../../models/Playlist');
const Song = require('../../models/Song');

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

// @route   GET /api/admin/playlists
// @desc    Get all curated playlists (admin only)
// @access  Admin
router.get('/', async (req, res) => {
  try {
    const playlists = await Playlist.find({ isCurated: true })
      .populate('songs', 'title artist cover url')
      .sort({ updatedAt: -1 })
      .lean();
    
    res.json(playlists);
  } catch (error) {
    console.error('Get admin playlists error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// @route   GET /api/playlists/curated
// @desc    Get curated playlists for homepage
// @access  Public
router.get('/curated', async (req, res) => {
  try {
    const playlists = await Playlist.find({ 
      isCurated: true, 
      isPublic: true 
    })
      .populate('songs', 'title artist cover url')
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean();
    
    res.json(playlists);
  } catch (error) {
    console.error('Get curated playlists error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// @route   GET /api/playlists/curated/:id
// @desc    Get curated playlist by ID
// @access  Public
router.get('/curated/:id', async (req, res) => {
  try {
    const playlist = await Playlist.findOne({ 
      _id: req.params.id,
      isCurated: true, 
      isPublic: true 
    })
      .populate('songs', 'title artist cover url');

    if (!playlist) {
      return res.status(404).json({ error: 'Không tìm thấy playlist' });
    }

    res.json(playlist);
  } catch (error) {
    console.error('Get curated playlist error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// @route   GET /api/admin/playlists/:id
// @desc    Get playlist by ID (admin only)
// @access  Admin
router.get('/:id', async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id)
      .populate('songs', 'title artist cover url album');

    if (!playlist) {
      return res.status(404).json({ error: 'Không tìm thấy playlist' });
    }

    res.json(playlist);
  } catch (error) {
    console.error('Get admin playlist error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// @route   POST /api/admin/playlists
// @desc    Create new playlist (admin only)
// @access  Admin
router.post('/', upload.single('cover'), async (req, res) => {
  try {
    const { name, description, isPublic, songs } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Tên playlist không được để trống' });
    }

    const playlistData = {
      name: name.trim(),
      description: description?.trim() || '',
      isPublic: isPublic === 'true' || isPublic === true,
      isCurated: true, // Mark as curated playlist
      // Admin playlists don't have a specific user
      user: null
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

    const playlist = new Playlist(playlistData);
    await playlist.save();

    // Populate songs for response
    await playlist.populate('songs', 'title artist cover url');

    res.status(201).json(playlist);
  } catch (error) {
    console.error('Create admin playlist error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// @route   PUT /api/admin/playlists/:id
// @desc    Update playlist (admin only)
// @access  Admin
router.put('/:id', upload.single('cover'), async (req, res) => {
  try {
    const { name, description, isPublic, songs } = req.body;
    
    const playlist = await Playlist.findById(req.params.id);

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
      // Delete old cover if exists
      if (playlist.cover) {
        const fs = require('fs');
        const oldCoverPath = path.join(__dirname, '../..', playlist.cover);
        if (fs.existsSync(oldCoverPath)) {
          fs.unlinkSync(oldCoverPath);
        }
      }
      playlist.cover = `/uploads/playlist_covers/${req.file.filename}`;
    }

    await playlist.save();

    // Populate songs for response
    await playlist.populate('songs', 'title artist cover url');

    res.json(playlist);
  } catch (error) {
    console.error('Update admin playlist error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// @route   DELETE /api/admin/playlists/:id
// @desc    Delete playlist (admin only)
// @access  Admin
router.delete('/:id', async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({ error: 'Không tìm thấy playlist' });
    }

    // Delete cover file if exists
    if (playlist.cover) {
      const fs = require('fs');
      const coverPath = path.join(__dirname, '../..', playlist.cover);
      if (fs.existsSync(coverPath)) {
        fs.unlinkSync(coverPath);
      }
    }

    await Playlist.findByIdAndDelete(req.params.id);

    res.json({ message: 'Xóa playlist thành công' });
  } catch (error) {
    console.error('Delete admin playlist error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// @route   POST /api/admin/playlists/:id/songs
// @desc    Add song to playlist (admin only)
// @access  Admin
router.post('/:id/songs', async (req, res) => {
  try {
    const { songId } = req.body;
    
    if (!songId) {
      return res.status(400).json({ error: 'Song ID không được để trống' });
    }

    const playlist = await Playlist.findById(req.params.id);

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

    // Populate songs for response
    await playlist.populate('songs', 'title artist cover url');

    res.json({
      message: 'Thêm bài hát vào playlist thành công',
      playlist
    });
  } catch (error) {
    console.error('Add song to admin playlist error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// @route   DELETE /api/admin/playlists/:id/songs/:songId
// @desc    Remove song from playlist (admin only)
// @access  Admin
router.delete('/:id/songs/:songId', async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({ error: 'Không tìm thấy playlist' });
    }

    playlist.songs = playlist.songs.filter(
      songId => songId.toString() !== req.params.songId
    );
    
    await playlist.save();

    // Populate songs for response
    await playlist.populate('songs', 'title artist cover url');

    res.json({
      message: 'Xóa bài hát khỏi playlist thành công',
      playlist
    });
  } catch (error) {
    console.error('Remove song from admin playlist error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

module.exports = router;
