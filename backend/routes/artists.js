const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Artist = require('../models/Artist');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Multer configuration for artist avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/artists');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// Helper function to generate slug from name
function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
}

// @route   POST /api/artists
// @desc    Create a new artist
// @access  Public (should be admin only in production)
router.post('/', upload.single('avatar'), async (req, res) => {
  try {
    const { name, bio, genres, country, debutYear, followers, monthlyListeners, isVerified, socialLinks } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Tên nghệ sĩ là bắt buộc' });
    }

    // Generate unique slug
    let slug = generateSlug(name);
    let existingArtist = await Artist.findOne({ slug });
    let counter = 1;
    while (existingArtist) {
      slug = `${generateSlug(name)}-${counter}`;
      existingArtist = await Artist.findOne({ slug });
      counter++;
    }

    const artistData = {
      name,
      slug,
      bio: bio || '',
      genres: genres ? JSON.parse(genres) : [],
      country: country || '',
      debutYear: debutYear ? parseInt(debutYear) : undefined,
      followers: followers ? parseInt(followers) : 0,
      monthlyListeners: monthlyListeners ? parseInt(monthlyListeners) : 0,
      isVerified: isVerified === 'true' || isVerified === true,
      socialLinks: socialLinks ? JSON.parse(socialLinks) : {}
    };

    if (req.file) {
      artistData.avatar = '/uploads/artists/' + req.file.filename;
    }

    const artist = new Artist(artistData);
    await artist.save();

    // Populate genres before sending response
    await artist.populate('genres');

    res.status(201).json(artist);
  } catch (error) {
    console.error('Create artist error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// @route   GET /api/artists
// @desc    Get all artists
// @access  Public
router.get('/', async (req, res) => {
  try {
    const artists = await Artist.find().populate('genres').sort({ name: 1 });
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

// @route   GET /api/artists/search
// @desc    Search artists by name
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) {
      return res.status(400).json({ error: 'Tên nghệ sĩ là bắt buộc' });
    }
    
    const artists = await Artist.find({
      name: { $regex: name, $options: 'i' }
    }).sort({ name: 1 });
    
    res.json(artists);
  } catch (error) {
    console.error('Search artists error:', error);
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
      
      // Update artist followers count
      artist.followers += 1;
      await artist.save();
    }

    res.json({ 
      message: 'Đã theo dõi nghệ sĩ',
      followers: artist.followers
    });
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
    const artist = await Artist.findById(req.params.id);
    if (!artist) {
      return res.status(404).json({ error: 'Không tìm thấy nghệ sĩ' });
    }

    const user = await User.findById(req.user._id);
    
    user.followedArtists = user.followedArtists.filter(
      artistId => artistId.toString() !== req.params.id
    );
    await user.save();

    // Update artist followers count
    artist.followers = Math.max(0, artist.followers - 1);
    await artist.save();

    res.json({ 
      message: 'Đã bỏ theo dõi nghệ sĩ',
      followers: artist.followers
    });
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

// @route   PUT /api/artists/:id
// @desc    Update artist information
// @access  Public (should be admin only in production)
router.put('/:id', upload.single('avatar'), async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);
    if (!artist) {
      return res.status(404).json({ error: 'Không tìm thấy nghệ sĩ' });
    }

    const { name, bio, genres, country, debutYear, followers, monthlyListeners, isVerified, socialLinks } = req.body;

    // Update fields
    if (name && name !== artist.name) {
      artist.name = name;
      // Regenerate slug if name changed
      let slug = generateSlug(name);
      let existingArtist = await Artist.findOne({ slug, _id: { $ne: req.params.id } });
      let counter = 1;
      while (existingArtist) {
        slug = `${generateSlug(name)}-${counter}`;
        existingArtist = await Artist.findOne({ slug, _id: { $ne: req.params.id } });
        counter++;
      }
      artist.slug = slug;
    }

    if (bio !== undefined) artist.bio = bio;
    if (genres) artist.genres = JSON.parse(genres);
    if (country !== undefined) artist.country = country;
    if (debutYear) artist.debutYear = parseInt(debutYear);
    if (followers !== undefined) artist.followers = parseInt(followers);
    if (monthlyListeners !== undefined) artist.monthlyListeners = parseInt(monthlyListeners);
    if (isVerified !== undefined) artist.isVerified = isVerified === 'true' || isVerified === true;
    if (socialLinks) artist.socialLinks = JSON.parse(socialLinks);

    // Update avatar if new file uploaded
    if (req.file) {
      // Delete old avatar file if exists
      if (artist.avatar && artist.avatar.startsWith('/uploads/artists/')) {
        const oldAvatarPath = path.join(__dirname, '..', artist.avatar);
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }
      artist.avatar = '/uploads/artists/' + req.file.filename;
    }

    await artist.save();
    await artist.populate('genres');

    res.json(artist);
  } catch (error) {
    console.error('Update artist error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// @route   DELETE /api/artists/:id
// @desc    Delete an artist
// @access  Public (should be admin only in production)
router.delete('/:id', async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);
    if (!artist) {
      return res.status(404).json({ error: 'Không tìm thấy nghệ sĩ' });
    }

    // Delete avatar file if exists
    if (artist.avatar && artist.avatar.startsWith('/uploads/artists/')) {
      const avatarPath = path.join(__dirname, '..', artist.avatar);
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }

    // Note: In production, you might want to check if artist has albums/songs
    // and handle those relationships before deleting
    await Artist.findByIdAndDelete(req.params.id);

    res.json({ message: 'Xóa nghệ sĩ thành công' });
  } catch (error) {
    console.error('Delete artist error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

module.exports = router;