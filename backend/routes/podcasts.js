const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Podcast = require('../models/Podcast');
const Episode = require('../models/Episode');
const Favorite = require('../models/Favorite');
const { protect } = require('../middleware/auth');

// Middleware kiểm tra admin
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Không có quyền truy cập' });
  }
  next();
};

// Cấu hình multer cho upload podcast cover
const podcastCoverStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/podcast_covers';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

// Cấu hình multer cho upload podcast audio
const podcastAudioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/podcast_audio';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

// Cấu hình multer chung cho upload files (fallback)
const generalStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

// Cấu hình multer cho upload episode audio
const episodeAudioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/podcast_episodes';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const podcastCoverUpload = multer({
  storage: podcastCoverStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit for cover images
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for podcast covers'));
    }
  }
});

// Upload instance cho podcast (cover + audio)
const podcastUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      let uploadPath;
      if (file.fieldname === 'cover') {
        uploadPath = 'uploads/podcast_covers';
      } else if (file.fieldname === 'audio') {
        uploadPath = 'uploads/podcast_audio';
      } else {
        uploadPath = 'uploads';
      }
      
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + '-' + file.originalname);
    }
  }),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'cover' && !file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed for cover!'), false);
    }
    if (file.fieldname === 'audio' && !file.mimetype.startsWith('audio/')) {
      return cb(new Error('Only audio files are allowed for episodes!'), false);
    }
    cb(null, true);
  },
});

// Upload instance chung (fallback)
const upload = multer({
  storage: generalStorage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'cover' && !file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed for cover!'), false);
    }
    if (file.fieldname === 'audio' && !file.mimetype.startsWith('audio/')) {
      return cb(new Error('Only audio files are allowed for episodes!'), false);
    }
    cb(null, true);
  },
});

// Multer config for podcast audio upload (single audio files)
const podcastAudioUpload = multer({
  storage: podcastCoverStorage, // Reuse same storage for now
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit for podcast audio
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed for podcast audio'));
    }
  }
});

const episodeAudioUpload = multer({
  storage: episodeAudioStorage,
  limits: {
    fileSize: 200 * 1024 * 1024 // 200MB limit for audio files
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed for episodes'));
    }
  }
});

// ==================== PODCAST ROUTES ====================

// GET /api/podcasts - Lấy danh sách podcast (public)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search, featured } = req.query;
    const query = { isActive: true };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.$text = { $search: search };
    }

    if (featured === 'true') {
      query.isFeatured = true;
    }

    const podcasts = await Podcast.find(query)
      .populate('episodes', 'title duration publishDate plays')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Podcast.countDocuments(query);

    res.json({
      podcasts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching podcasts:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// GET /api/podcasts/favorites - Lấy danh sách podcast yêu thích của user
router.get('/favorites', protect, async (req, res) => {
  try {
    // console.log('Fetching favorite podcasts for user:', req.user._id);
    
    const favoritePodcasts = await Favorite.find({
      user: req.user._id,
      type: 'podcast'
    }).populate('podcast');
    
    // console.log('Found favorite podcasts:', favoritePodcasts.length);
    
    const podcasts = favoritePodcasts
      .map(fav => fav.podcast)
      .filter(podcast => podcast); // Filter out null podcasts
    
    // console.log('Filtered podcasts:', podcasts.length);
    res.json({ podcasts });
  } catch (error) {
    console.error('Error fetching favorite podcasts:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// GET /api/podcasts/:id - Lấy chi tiết podcast (public)
router.get('/:id', async (req, res) => {
  try {
    const podcast = await Podcast.findById(req.params.id)
      .populate({
        path: 'episodes',
        match: { isPublished: true },
        options: { sort: { episodeNumber: 1 } }
      });

    if (!podcast) {
      return res.status(404).json({ message: 'Không tìm thấy podcast' });
    }

    res.json(podcast);
  } catch (error) {
    console.error('Error fetching podcast:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST /api/podcasts - Tạo podcast mới (admin only)
router.post('/', protect, requireAdmin, podcastUpload.fields([
  { name: 'cover', maxCount: 1 },
  { name: 'audio', maxCount: 1 }
]), async (req, res) => {
  try {
    const podcastData = {
      ...req.body,
      cover: req.files?.cover?.[0] ? `/uploads/podcast_covers/${req.files.cover[0].filename}` : null,
      audioUrl: req.files?.audio?.[0] ? `/uploads/podcast_audio/${req.files.audio[0].filename}` : null
    };

    // Parse hosts array if it's a string
    if (podcastData.hosts && typeof podcastData.hosts === 'string') {
      podcastData.hosts = podcastData.hosts.split(',').map(host => host.trim());
    }

    // Parse tags array if it's a string
    if (podcastData.tags && typeof podcastData.tags === 'string') {
      podcastData.tags = podcastData.tags.split(',').map(tag => tag.trim());
    }

    const podcast = new Podcast(podcastData);
    await podcast.save();

    res.status(201).json(podcast);
  } catch (error) {
    console.error('Error creating podcast:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// PUT /api/podcasts/:id - Cập nhật podcast (admin only)
router.put('/:id', protect, requireAdmin, podcastUpload.fields([
  { name: 'cover', maxCount: 1 },
  { name: 'audio', maxCount: 1 }
]), async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.files?.cover?.[0]) {
      updateData.cover = `/uploads/podcast_covers/${req.files.cover[0].filename}`;
    }
    
    if (req.files?.audio?.[0]) {
      updateData.audioUrl = `/uploads/podcast_audio/${req.files.audio[0].filename}`;
    }

    // Parse hosts array if it's a string
    if (updateData.hosts && typeof updateData.hosts === 'string') {
      updateData.hosts = updateData.hosts.split(',').map(host => host.trim());
    }

    // Parse tags array if it's a string
    if (updateData.tags && typeof updateData.tags === 'string') {
      updateData.tags = updateData.tags.split(',').map(tag => tag.trim());
    }

    const podcast = await Podcast.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!podcast) {
      return res.status(404).json({ message: 'Không tìm thấy podcast' });
    }

    res.json(podcast);
  } catch (error) {
    console.error('Error updating podcast:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// DELETE /api/podcasts/:id - Xóa podcast (admin only)
router.delete('/:id', protect, requireAdmin, async (req, res) => {
  try {
    const podcast = await Podcast.findById(req.params.id);
    if (!podcast) {
      return res.status(404).json({ message: 'Không tìm thấy podcast' });
    }

    // Xóa tất cả episodes của podcast
    await Episode.deleteMany({ podcast: podcast._id });

    // Xóa podcast
    await Podcast.findByIdAndDelete(req.params.id);

    res.json({ message: 'Podcast đã được xóa thành công' });
  } catch (error) {
    console.error('Error deleting podcast:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// ==================== EPISODE ROUTES ====================

// GET /api/podcasts/:podcastId/episodes - Lấy danh sách episodes
router.get('/:podcastId/episodes', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const episodes = await Episode.find({ 
      podcast: req.params.podcastId,
      isPublished: true 
    })
    .sort({ episodeNumber: 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Episode.countDocuments({ 
      podcast: req.params.podcastId,
      isPublished: true 
    });

    res.json({
      episodes,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching episodes:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST /api/podcasts/:podcastId/episodes - Tạo episode mới (admin only)
router.post('/:podcastId/episodes', protect, requireAdmin, episodeAudioUpload.single('audio'), async (req, res) => {
  try {
    const podcast = await Podcast.findById(req.params.podcastId);
    if (!podcast) {
      return res.status(404).json({ message: 'Không tìm thấy podcast' });
    }

    // Get next episode number
    const lastEpisode = await Episode.findOne({ podcast: req.params.podcastId })
      .sort({ episodeNumber: -1 });
    const nextEpisodeNumber = lastEpisode ? lastEpisode.episodeNumber + 1 : 1;

    const episodeData = {
      ...req.body,
      podcast: req.params.podcastId,
      audioUrl: req.file ? `/uploads/podcast_episodes/${req.file.filename}` : null,
      fileSize: req.file ? req.file.size : 0,
      episodeNumber: nextEpisodeNumber
    };

    // Parse guests array if it's a string
    if (episodeData.guests && typeof episodeData.guests === 'string') {
      episodeData.guests = JSON.parse(episodeData.guests);
    }

    // Parse tags array if it's a string
    if (episodeData.tags && typeof episodeData.tags === 'string') {
      episodeData.tags = episodeData.tags.split(',').map(tag => tag.trim());
    }

    const episode = new Episode(episodeData);
    await episode.save();

    // Add episode to podcast
    podcast.episodes.push(episode._id);
    await podcast.save();

    // Update podcast duration
    await podcast.updateDuration();

    res.status(201).json(episode);
  } catch (error) {
    console.error('Error creating episode:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// PUT /api/podcasts/:podcastId/episodes/:episodeId - Cập nhật episode (admin only)
router.put('/:podcastId/episodes/:episodeId', protect, requireAdmin, episodeAudioUpload.single('audio'), async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.file) {
      updateData.audioUrl = `/uploads/podcast_episodes/${req.file.filename}`;
      updateData.fileSize = req.file.size;
    }

    // Parse guests array if it's a string
    if (updateData.guests && typeof updateData.guests === 'string') {
      updateData.guests = JSON.parse(updateData.guests);
    }

    // Parse tags array if it's a string
    if (updateData.tags && typeof updateData.tags === 'string') {
      updateData.tags = updateData.tags.split(',').map(tag => tag.trim());
    }

    const episode = await Episode.findOneAndUpdate(
      { _id: req.params.episodeId, podcast: req.params.podcastId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!episode) {
      return res.status(404).json({ message: 'Không tìm thấy episode' });
    }

    // Update podcast duration
    const podcast = await Podcast.findById(req.params.podcastId);
    if (podcast) {
      await podcast.updateDuration();
    }

    res.json(episode);
  } catch (error) {
    console.error('Error updating episode:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// DELETE /api/podcasts/:podcastId/episodes/:episodeId - Xóa episode (admin only)
router.delete('/:podcastId/episodes/:episodeId', protect, requireAdmin, async (req, res) => {
  try {
    const episode = await Episode.findOneAndDelete({
      _id: req.params.episodeId,
      podcast: req.params.podcastId
    });

    if (!episode) {
      return res.status(404).json({ message: 'Không tìm thấy episode' });
    }

    // Remove episode from podcast
    await Podcast.findByIdAndUpdate(req.params.podcastId, {
      $pull: { episodes: episode._id }
    });

    // Update podcast duration
    const podcast = await Podcast.findById(req.params.podcastId);
    if (podcast) {
      await podcast.updateDuration();
    }

    res.json({ message: 'Episode đã được xóa thành công' });
  } catch (error) {
    console.error('Error deleting episode:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST /api/podcasts/:podcastId/episodes/:episodeId/play - Tăng lượt nghe episode
router.post('/:podcastId/episodes/:episodeId/play', async (req, res) => {
  try {
    const episode = await Episode.findOne({
      _id: req.params.episodeId,
      podcast: req.params.podcastId
    });

    if (!episode) {
      return res.status(404).json({ message: 'Không tìm thấy episode' });
    }

    await episode.incrementPlays();
    res.json({ message: 'Đã cập nhật lượt nghe' });
  } catch (error) {
    console.error('Error incrementing episode plays:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST /api/podcasts/:id/favorite - Thêm/xóa podcast khỏi yêu thích
router.post('/:id/favorite', protect, async (req, res) => {
  try {
    
    const podcastId = req.params.id;
    const userId = req.user._id;
    
    // Kiểm tra podcast có tồn tại không
    const podcast = await Podcast.findById(podcastId);
    if (!podcast) {
      return res.status(404).json({ message: 'Podcast không tồn tại' });
    }
    
    // Kiểm tra đã favorite chưa
    const existingFavorite = await Favorite.findOne({
      user: userId,
      podcast: podcastId,
      type: 'podcast'
    });
    
    if (existingFavorite) {
      // Xóa khỏi favorite
      await Favorite.findByIdAndDelete(existingFavorite._id);
      res.json({ message: 'Đã xóa khỏi yêu thích', isFavorite: false });
    } else {
      // Thêm vào favorite
      await Favorite.create({
        user: userId,
        podcast: podcastId,
        type: 'podcast'
      });
      res.json({ message: 'Đã thêm vào yêu thích', isFavorite: true });
    }
  } catch (error) {
    console.error('Error toggling podcast favorite:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;
