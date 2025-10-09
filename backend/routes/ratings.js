const express = require('express');
const router = express.Router();
const Rating = require('../models/Rating');
const { protect } = require('../middleware/auth');

// GET /api/albums/:albumId/ratings - Get rating statistics for an album
router.get('/:albumId/ratings', async (req, res) => {
  try {
    const { albumId } = req.params;

    // Get all ratings for this album
    const ratings = await Rating.find({ album: albumId });
    
    if (ratings.length === 0) {
      return res.json({
        average: 0,
        count: 0,
        breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      });
    }

    // Calculate average
    const total = ratings.reduce((sum, rating) => sum + rating.rating, 0);
    const average = total / ratings.length;

    // Calculate breakdown
    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach(rating => {
      breakdown[rating.rating]++;
    });

    res.json({
      average: Math.round(average * 10) / 10, // Round to 1 decimal place
      count: ratings.length,
      breakdown
    });
  } catch (error) {
    console.error('Get ratings error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// POST /api/albums/:albumId/ratings - Create or update a rating
router.post('/:albumId/ratings', protect, async (req, res) => {
  try {
    const { albumId } = req.params;
    const { rating, userId } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Đánh giá phải từ 1 đến 5' });
    }

    // Check if user already rated this album
    const existingRating = await Rating.findOne({ album: albumId, user: userId });

    if (existingRating) {
      // Update existing rating
      existingRating.rating = rating;
      await existingRating.save();
      
      res.json({
        message: 'Đánh giá đã được cập nhật',
        rating: existingRating.rating
      });
    } else {
      // Create new rating
      const newRating = new Rating({
        album: albumId,
        user: userId,
        rating: rating
      });

      await newRating.save();

      res.status(201).json({
        message: 'Đánh giá đã được lưu thành công',
        rating: newRating.rating
      });
    }
  } catch (error) {
    console.error('Create/update rating error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// GET /api/albums/:albumId/ratings/user/:userId - Get user's rating for an album
router.get('/:albumId/ratings/user/:userId', protect, async (req, res) => {
  try {
    const { albumId, userId } = req.params;

    const rating = await Rating.findOne({ album: albumId, user: userId });
    
    res.json({
      rating: rating ? rating.rating : 0
    });
  } catch (error) {
    console.error('Get user rating error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

module.exports = router;

