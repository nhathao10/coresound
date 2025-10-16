const express = require('express');
const router = express.Router();
const DailySong = require('../models/DailySong');
const GameResult = require('../models/GameResult');
const Song = require('../models/Song');
const Genre = require('../models/Genre');
const { protect } = require('../middleware/auth');

// Get today's daily song
router.get('/daily-song', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find today's daily song
    let dailySong = await DailySong.findOne({ 
      date: { $gte: today, $lt: tomorrow }
    }).populate('song');

    // If no daily song exists for today, create one
    if (!dailySong) {
      // Get all songs
      const songs = await Song.find({});
      
      if (songs.length === 0) {
        return res.status(404).json({ error: 'Không có bài hát nào trong database' });
      }

      // Get a random song
      const randomSong = songs[Math.floor(Math.random() * songs.length)];
      
      // Start from the beginning of the song
      const startTime = 0;

      // Get genre info for hints
      let genreName = 'Unknown';
      if (randomSong.genres && randomSong.genres.length > 0) {
        const genre = await Genre.findById(randomSong.genres[0]);
        if (genre) {
          genreName = genre.name;
        }
      }

      // Create new daily song
      dailySong = new DailySong({
        date: today,
        song: randomSong._id,
        startTime: Math.floor(startTime),
        duration: 30,
        hints: {
          genre: genreName,
          artist: randomSong.artist || 'Unknown Artist',
          year: randomSong.createdAt ? randomSong.createdAt.getFullYear() : new Date().getFullYear()
        }
      });

      await dailySong.save();
      await dailySong.populate('song');
      
      // Update hints with populated song data if needed
      if (!dailySong.hints.artist || dailySong.hints.artist === 'Unknown Artist') {
        dailySong.hints.artist = dailySong.song.artist || 'Unknown Artist';
        await dailySong.save();
      }
    }

    // Return the daily song data
    res.json({
      songId: dailySong.song._id,
      audioUrl: dailySong.song.url,
      startTime: dailySong.startTime,
      duration: dailySong.duration,
      hints: dailySong.hints,
      totalPlayers: dailySong.totalPlayers,
      correctAnswers: dailySong.correctAnswers
    });

  } catch (error) {
    console.error('Error fetching daily song:', error);
    res.status(500).json({ error: 'Lỗi server khi tải bài hát hôm nay' });
  }
});

// Check answer for daily song
router.post('/daily-song/check-answer', protect, async (req, res) => {
  try {
    const { songId, userAnswer, timeSpent, hintsUsed } = req.body;
    const userId = req.user.id;

    // Find today's daily song
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dailySong = await DailySong.findOne({ 
      date: { $gte: today, $lt: tomorrow }
    }).populate('song');

    if (!dailySong) {
      return res.status(404).json({ error: 'Không tìm thấy bài hát hôm nay' });
    }

    // Check if user already played today (allow replay for practice)
    const existingResult = await GameResult.findOne({
      user: userId,
      dailySong: dailySong._id
    });

    // Allow replay but don't save new results if already played
    const hasPlayedToday = !!existingResult;

    // Check answer accuracy
    const correctTitle = dailySong.song.title.toLowerCase().trim();
    const correctArtist = dailySong.song.artist.toLowerCase().trim();
    const userAnswerLower = userAnswer.toLowerCase().trim();

    // Simple matching - check if user answer contains song title or artist
    const isCorrect = userAnswerLower.includes(correctTitle) || 
                     userAnswerLower.includes(correctArtist) ||
                     correctTitle.includes(userAnswerLower) ||
                     correctArtist.includes(userAnswerLower);

    // Calculate score
    let score = 0;
    if (isCorrect) {
      const baseScore = 1000;
      const timeBonus = Math.max(0, (30 - timeSpent) * 10);
      const hintPenalty = hintsUsed * 100;
      score = Math.max(0, baseScore + timeBonus - hintPenalty);
    }

    // Save game result only if not played today
    if (!hasPlayedToday) {
      const gameResult = new GameResult({
        user: userId,
        dailySong: dailySong._id,
        isCorrect,
        timeSpent,
        hintsUsed,
        score
      });

      await gameResult.save();

      // Update daily song stats
      dailySong.totalPlayers += 1;
      if (isCorrect) {
        dailySong.correctAnswers += 1;
      }
      
      // Update average score
      const allResults = await GameResult.find({ dailySong: dailySong._id });
      const totalScore = allResults.reduce((sum, result) => sum + result.score, 0);
      dailySong.averageScore = Math.round(totalScore / allResults.length);
      
      await dailySong.save();
    }

    res.json({
      isCorrect,
      score: hasPlayedToday ? existingResult.score : score, // Use existing score if already played
      hasPlayedToday,
      correctAnswer: {
        title: dailySong.song.title,
        artist: dailySong.song.artist,
        cover: dailySong.song.cover
      },
      stats: {
        totalPlayers: dailySong.totalPlayers,
        correctAnswers: dailySong.correctAnswers,
        averageScore: dailySong.averageScore
      }
    });

  } catch (error) {
    console.error('Error checking answer:', error);
    res.status(500).json({ error: 'Lỗi server khi kiểm tra câu trả lời' });
  }
});

// Get user's game history
router.get('/game-history', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const results = await GameResult.find({ user: userId })
      .populate('dailySong')
      .populate({
        path: 'dailySong',
        populate: {
          path: 'song',
          select: 'title artist'
        }
      })
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await GameResult.countDocuments({ user: userId });

    res.json({
      results,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching game history:', error);
    res.status(500).json({ error: 'Lỗi server khi tải lịch sử game' });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const period = req.query.period || 'week'; // week, month, all
    let dateFilter = {};

    if (period === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { submittedAt: { $gte: weekAgo } };
    } else if (period === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = { submittedAt: { $gte: monthAgo } };
    }

    const leaderboard = await GameResult.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$user',
          totalScore: { $sum: '$score' },
          gamesPlayed: { $sum: 1 },
          correctAnswers: { $sum: { $cond: ['$isCorrect', 1, 0] } },
          averageScore: { $avg: '$score' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          name: '$user.name',
          avatar: '$user.avatar',
          totalScore: 1,
          gamesPlayed: 1,
          correctAnswers: 1,
          averageScore: { $round: ['$averageScore', 0] },
          accuracy: { $round: [{ $multiply: [{ $divide: ['$correctAnswers', '$gamesPlayed'] }, 100] }, 1] }
        }
      },
      { $sort: { totalScore: -1 } },
      { $limit: 50 }
    ]);

    res.json({ leaderboard, period });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Lỗi server khi tải bảng xếp hạng' });
  }
});

// Reset today's game for testing (DEV ONLY)
router.delete('/reset-today', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find today's daily song
    const dailySong = await DailySong.findOne({ 
      date: { $gte: today, $lt: tomorrow }
    });

    if (!dailySong) {
      return res.status(404).json({ error: 'Không tìm thấy bài hát hôm nay' });
    }

    // Delete user's game result for today
    await GameResult.deleteOne({
      user: userId,
      dailySong: dailySong._id
    });

    res.json({ message: 'Đã reset lượt chơi hôm nay thành công!' });
  } catch (error) {
    console.error('Error resetting today game:', error);
    res.status(500).json({ error: 'Lỗi server khi reset lượt chơi' });
  }
});

// Generate new random song for testing (DEV ONLY)
router.post('/new-random-song', protect, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Delete existing daily song for today
    await DailySong.deleteOne({ 
      date: { $gte: today, $lt: tomorrow }
    });

    // Delete all game results for today
    await GameResult.deleteMany({
      createdAt: { $gte: today, $lt: tomorrow }
    });

    // Get all songs
    const songs = await Song.find({}).populate('genres');
    if (songs.length === 0) {
      return res.status(404).json({ error: 'Không có bài hát nào trong database' });
    }

    // Get a random song
    const randomSong = songs[Math.floor(Math.random() * songs.length)];
    
    // Start from the beginning of the song
    const startTime = 0;

    // Get genre info for hints
    let genreName = 'Unknown';
    if (randomSong.genres && randomSong.genres.length > 0) {
      const genre = await Genre.findById(randomSong.genres[0]);
      if (genre) {
        genreName = genre.name;
      }
    }

    // Create new daily song
    const newDailySong = new DailySong({
      date: today,
      song: randomSong._id,
      startTime: Math.floor(startTime),
      duration: 30,
      hints: {
        genre: genreName,
        artist: randomSong.artist || 'Unknown Artist',
        year: randomSong.createdAt ? randomSong.createdAt.getFullYear() : new Date().getFullYear()
      }
    });

    await newDailySong.save();
    await newDailySong.populate('song');
    
    // Update hints with populated song data if needed
    if (!newDailySong.hints.artist || newDailySong.hints.artist === 'Unknown Artist') {
      newDailySong.hints.artist = newDailySong.song.artist || 'Unknown Artist';
      await newDailySong.save();
    }

    res.json({ 
      message: 'Đã tạo bài hát mới thành công!',
      song: {
        title: newDailySong.song.title,
        artist: newDailySong.song.artist,
        genre: newDailySong.hints.genre
      }
    });
  } catch (error) {
    console.error('Error generating new random song:', error);
    res.status(500).json({ error: 'Lỗi server khi tạo bài hát mới' });
  }
});

module.exports = router;
