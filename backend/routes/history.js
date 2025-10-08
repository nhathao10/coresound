const express = require('express');
const ListeningHistory = require('../models/ListeningHistory');
const Song = require('../models/Song');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/history
// @desc    Get user's listening history
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const history = await ListeningHistory.find({ user: req.user._id })
      .populate('song', 'title artist cover url album')
      .sort({ playedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ListeningHistory.countDocuments({ user: req.user._id });

    res.json({
      history,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: history.length,
        totalCount: total
      }
    });
  } catch (error) {
    console.error('Get listening history error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// @route   POST /api/history
// @desc    Add song to listening history
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { songId, duration, completed } = req.body;
    
    if (!songId) {
      return res.status(400).json({ error: 'Song ID không được để trống' });
    }

    // Check if song exists
    const song = await Song.findById(songId);
    if (!song) {
      return res.status(404).json({ error: 'Không tìm thấy bài hát' });
    }

    // Create or update listening history entry
    const historyEntry = await ListeningHistory.findOneAndUpdate(
      { 
        user: req.user._id, 
        song: songId,
        playedAt: { 
          $gte: new Date(Date.now() - 5 * 60 * 1000) // Within last 5 minutes
        }
      },
      {
        user: req.user._id,
        song: songId,
        playedAt: new Date(),
        duration: duration || 0,
        completed: completed || false
      },
      { 
        upsert: true, 
        new: true 
      }
    );

    res.json({
      message: 'Đã thêm vào lịch sử nghe nhạc',
      historyEntry
    });
  } catch (error) {
    console.error('Add to listening history error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// @route   DELETE /api/history/:id
// @desc    Remove entry from listening history
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const historyEntry = await ListeningHistory.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!historyEntry) {
      return res.status(404).json({ error: 'Không tìm thấy lịch sử nghe nhạc' });
    }

    res.json({ message: 'Đã xóa khỏi lịch sử nghe nhạc' });
  } catch (error) {
    console.error('Delete listening history error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// @route   DELETE /api/history
// @desc    Clear all listening history
// @access  Private
router.delete('/', protect, async (req, res) => {
  try {
    await ListeningHistory.deleteMany({ user: req.user._id });

    res.json({ message: 'Đã xóa toàn bộ lịch sử nghe nhạc' });
  } catch (error) {
    console.error('Clear listening history error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// @route   GET /api/history/stats
// @desc    Get listening statistics
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const startDate = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000);

    // Total listening time
    const totalListeningTime = await ListeningHistory.aggregate([
      { $match: { user: req.user._id, playedAt: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: '$duration' } } }
    ]);

    // Most played songs
    const mostPlayedSongs = await ListeningHistory.aggregate([
      { $match: { user: req.user._id, playedAt: { $gte: startDate } } },
      { $group: { _id: '$song', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'songs',
          localField: '_id',
          foreignField: '_id',
          as: 'song'
        }
      },
      { $unwind: '$song' },
      { $project: { song: 1, count: 1 } }
    ]);

    // Listening activity by day
    const dailyActivity = await ListeningHistory.aggregate([
      { $match: { user: req.user._id, playedAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$playedAt' },
            month: { $month: '$playedAt' },
            day: { $dayOfMonth: '$playedAt' }
          },
          count: { $sum: 1 },
          totalDuration: { $sum: '$duration' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    res.json({
      totalListeningTime: totalListeningTime[0]?.total || 0,
      mostPlayedSongs,
      dailyActivity,
      period: parseInt(period)
    });
  } catch (error) {
    console.error('Get listening stats error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

module.exports = router;
