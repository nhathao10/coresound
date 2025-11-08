const express = require('express');
const router = express.Router();
const DailySong = require('../models/DailySong');
const GameResult = require('../models/GameResult');
const Song = require('../models/Song');
const Genre = require('../models/Genre');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Check if user has completed today's game
router.get('/daily-song/status', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find all today's daily songs (should be 3)
    const dailySongs = await DailySong.find({ 
      date: { $gte: today, $lt: tomorrow }
    }).sort({ sequence: 1 }).populate('song');

    if (dailySongs.length === 0) {
      return res.json({ hasPlayed: false, completedAllRounds: false, gameResult: null });
    }

    // Check if user has completed all 3 rounds today
    const gameResult = await GameResult.findOne({
      user: userId,
      completedAllRounds: true,
      createdAt: { $gte: today, $lt: tomorrow }
    }).populate('dailySong');

    if (gameResult) {
      await gameResult.populate({
        path: 'dailySong',
        populate: { path: 'song' }
      });
      
      return res.json({
        hasPlayed: true,
        completedAllRounds: true,
        gameResult: {
          isCorrect: gameResult.isCorrect,
          score: gameResult.score,
          timeSpent: gameResult.timeSpent,
          hintsUsed: gameResult.hintsUsed,
          roundNumber: gameResult.roundNumber,
          submittedAt: gameResult.submittedAt,
          song: {
            title: gameResult.dailySong.song.title,
            artist: gameResult.dailySong.song.artist,
            cover: gameResult.dailySong.song.cover
          }
        }
      });
    }

    res.json({ hasPlayed: false, completedAllRounds: false, gameResult: null });
  } catch (error) {
    console.error('Error checking game status:', error);
    res.status(500).json({ error: 'Lỗi server khi kiểm tra trạng thái game' });
  }
});

// Get today's daily song (with sequence support for 3 songs)
router.get('/daily-song', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const sequence = parseInt(req.query.sequence) || 1; // Get sequence from query, default to 1

    // Check how many daily songs exist for today
    const existingSongsCount = await DailySong.countDocuments({ 
      date: { $gte: today, $lt: tomorrow }
    });

    // If less than 3 songs exist for today, create all 3 at once
    if (existingSongsCount < 3) {
      // First, delete any existing songs for today to avoid duplicates
      if (existingSongsCount > 0) {
        await DailySong.deleteMany({ 
          date: { $gte: today, $lt: tomorrow }
        });
      }
      // Get all songs
      const songs = await Song.find({});
      
      if (songs.length < 3) {
        return res.status(404).json({ error: 'Cần ít nhất 3 bài hát trong database' });
      }

      // Get songs that were used in the last 7 days to avoid repetition
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentDailySongs = await DailySong.find({
        date: { $gte: sevenDaysAgo, $lt: today }
      }).select('song');
      
      const recentSongIds = new Set(recentDailySongs.map(ds => ds.song.toString()));
      
      // Filter out recently used songs if we have enough songs
      let availableSongs = songs;
      if (songs.length > 21) { // Only filter if we have more than 21 songs (7 days * 3 songs)
        availableSongs = songs.filter(song => !recentSongIds.has(song._id.toString()));
      }
      
      // If filtering left us with less than 3 songs, use all songs
      if (availableSongs.length < 3) {
        availableSongs = songs;
      }

      // Shuffle array using Fisher-Yates algorithm for better randomness
      const shuffleArray = (array) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      };

      // Shuffle and select 3 unique songs
      const shuffledSongs = shuffleArray(availableSongs);
      const selectedSongs = shuffledSongs.slice(0, 3);

      console.log(`[Daily Song] Selected ${selectedSongs.length} songs for ${today.toISOString().split('T')[0]}`);
      console.log(`[Daily Song] Total songs in DB: ${songs.length}, Available after filtering: ${availableSongs.length}`);
      if (selectedSongs.length > 0) {
        console.log(`[Daily Song] Songs: ${selectedSongs.map(s => `${s.title || 'Unknown'} - ${s.artist || 'Unknown'}`).join(', ')}`);
      }

      // Create 3 daily songs
      for (let i = 0; i < 3; i++) {
        try {
          const randomSong = selectedSongs[i];
          const startTime = 0;

          // Get genre info for hints
          let genreName = 'Unknown';
          if (randomSong.genres && randomSong.genres.length > 0) {
            const genre = await Genre.findById(randomSong.genres[0]);
            if (genre) {
              genreName = genre.name;
            }
          }

          const newDailySong = new DailySong({
            date: today,
            song: randomSong._id,
            sequence: i + 1,
            startTime: Math.floor(startTime),
            duration: 30,
            hints: {
              genre: genreName,
              artist: randomSong.artist || 'Unknown Artist',
              year: randomSong.createdAt ? randomSong.createdAt.getFullYear() : new Date().getFullYear()
            }
          });

          await newDailySong.save();
          
          // Update hints with populated song data if needed
          if (!newDailySong.hints.artist || newDailySong.hints.artist === 'Unknown Artist') {
            newDailySong.hints.artist = randomSong.artist || 'Unknown Artist';
            await newDailySong.save();
          }
        } catch (err) {
          console.error('[Daily Song] Error creating sequence:', err.message);
          throw err;
        }
      }
    }

    // Fetch the requested sequence
    let dailySong = await DailySong.findOne({ 
      date: { $gte: today, $lt: tomorrow },
      sequence: sequence
    }).populate('song');

    if (!dailySong) {
      return res.status(404).json({ 
        error: `Không tìm thấy bài hát sequence ${sequence} cho hôm nay`
      });
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
    const { songId, userAnswer, timeSpent, hintsUsed, roundNumber, currentScore } = req.body;
    const userId = req.user.id;

    // Find today's daily song
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dailySong = await DailySong.findOne({ 
      date: { $gte: today, $lt: tomorrow },
      song: songId
    }).populate('song');

    if (!dailySong) {
      return res.status(404).json({ error: 'Không tìm thấy bài hát hôm nay' });
    }

    // Check if user already completed all rounds today
    const completedResult = await GameResult.findOne({
      user: userId,
      completedAllRounds: true,
      createdAt: { $gte: today, $lt: tomorrow }
    });

    // Allow replay but don't save new results if already completed all rounds
    const hasPlayedToday = !!completedResult;

    // Check answer accuracy
    const correctTitle = dailySong.song.title.toLowerCase().trim();
    const correctArtist = dailySong.song.artist.toLowerCase().trim();
    const userAnswerLower = userAnswer.toLowerCase().trim();

    // Parse user answer to extract title and artist (format: "Title - Artist")
    const parts = userAnswerLower.split('-').map(part => part.trim());
    const userTitle = parts[0] || '';
    const userArtist = parts.length > 1 ? parts.slice(1).join('-').trim() : '';

    // Normalize strings for comparison (remove extra spaces, normalize)
    const normalizeString = (str) => {
      return str.replace(/\s+/g, ' ').trim();
    };

    const normalizedCorrectTitle = normalizeString(correctTitle);
    const normalizedCorrectArtist = normalizeString(correctArtist);
    const normalizedUserTitle = normalizeString(userTitle);
    const normalizedUserArtist = normalizeString(userArtist);

    // STRICT matching: Both title AND artist must match EXACTLY
    // This ensures that:
    // - "Perfect - Ed Sheeran" will NOT match "Shape of You - Ed Sheeran" (different songs)
    // - "Shape - Ed Sheeran" will NOT match "Shape of You - Ed Sheeran" (partial title)
    // - Only exact matches are accepted
    
    // Title must match EXACTLY (after normalization)
    const titleMatch = normalizedUserTitle === normalizedCorrectTitle;
    
    // Artist must match EXACTLY (after normalization)
    const artistMatch = normalizedUserArtist === normalizedCorrectArtist;

    // Both title AND artist must match EXACTLY for the answer to be correct
    // Also ensure user provided both title and artist
    const isCorrect = titleMatch && artistMatch && normalizedUserTitle.length > 0 && normalizedUserArtist.length > 0;

    // Calculate score (no timer, so no time bonus)
    let score = 0;
    if (isCorrect) {
      // Use currentScore from frontend (already includes skip penalties)
      // If currentScore is not provided, fallback to base calculation
      if (currentScore !== undefined && currentScore !== null) {
        // Ensure minimum score of 10 points when answer is correct
        score = Math.max(10, currentScore);
      } else {
        const baseScore = 1000;
        const hintPenalty = hintsUsed * 100;
        score = Math.max(10, baseScore - hintPenalty);
      }
    }

    // Save game result only if not completed all rounds today
    if (!hasPlayedToday) {
      const currentRound = roundNumber || 1;
      const isLastRound = currentRound === 3;
      
      const gameResult = new GameResult({
        user: userId,
        dailySong: dailySong._id,
        isCorrect,
        timeSpent,
        hintsUsed,
        score,
        roundNumber: currentRound,
        completedAllRounds: isLastRound
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
      score: hasPlayedToday ? completedResult.score : score, // Use existing score if already played
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

// Generate new random songs for testing (DEV ONLY) - Creates 3 songs
router.post('/new-random-song', protect, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Delete existing daily songs for today (all 3)
    await DailySong.deleteMany({ 
      date: { $gte: today, $lt: tomorrow }
    });

    // Delete all game results for today
    await GameResult.deleteMany({
      createdAt: { $gte: today, $lt: tomorrow }
    });

    // Get all songs
    const songs = await Song.find({}).populate('genres');
    if (songs.length < 3) {
      return res.status(404).json({ error: 'Cần ít nhất 3 bài hát trong database' });
    }

    // Get songs that were used in the last 7 days to avoid repetition
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentDailySongs = await DailySong.find({
      date: { $gte: sevenDaysAgo, $lt: today }
    }).select('song');
    
    const recentSongIds = new Set(recentDailySongs.map(ds => ds.song.toString()));
    
    // Filter out recently used songs if we have enough songs
    let availableSongs = songs;
    if (songs.length > 21) { // Only filter if we have more than 21 songs (7 days * 3 songs)
      availableSongs = songs.filter(song => !recentSongIds.has(song._id.toString()));
    }
    
    // If filtering left us with less than 3 songs, use all songs
    if (availableSongs.length < 3) {
      availableSongs = songs;
    }

    // Shuffle array using Fisher-Yates algorithm for better randomness
    const shuffleArray = (array) => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    // Shuffle and select 3 unique songs
    const shuffledSongs = shuffleArray(availableSongs);
    const selectedSongs = shuffledSongs.slice(0, 3);

    // Create 3 daily songs
    const createdSongs = [];
    for (let i = 0; i < 3; i++) {
      const randomSong = selectedSongs[i];
      const startTime = 0;

      // Get genre info for hints
      let genreName = 'Unknown';
      if (randomSong.genres && randomSong.genres.length > 0) {
        const genre = await Genre.findById(randomSong.genres[0]);
        if (genre) {
          genreName = genre.name;
        }
      }

      const newDailySong = new DailySong({
        date: today,
        song: randomSong._id,
        sequence: i + 1,
        startTime: Math.floor(startTime),
        duration: 30,
        hints: {
          genre: genreName,
          artist: randomSong.artist || 'Unknown Artist',
          year: randomSong.createdAt ? randomSong.createdAt.getFullYear() : new Date().getFullYear()
        }
      });

      await newDailySong.save();
      
      // Update hints with populated song data if needed
      if (!newDailySong.hints.artist || newDailySong.hints.artist === 'Unknown Artist') {
        newDailySong.hints.artist = randomSong.artist || 'Unknown Artist';
        await newDailySong.save();
      }
      
      createdSongs.push({
        sequence: i + 1,
        title: randomSong.title,
        artist: randomSong.artist,
        genre: genreName
      });
    }

    res.json({ 
      message: 'Đã tạo 3 bài hát mới thành công!',
      songs: createdSongs
    });
  } catch (error) {
    console.error('Error generating new random songs:', error);
    res.status(500).json({ error: 'Lỗi server khi tạo bài hát mới' });
  }
});

// Check if user can access the game (Free users: 3 plays limit)
router.get('/game/access-check', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }

    const isPremium = user.isPremium && (!user.premiumExpiresAt || user.premiumExpiresAt > new Date());
    const freeGamePlaysUsed = user.freeGamePlaysUsed || 0;
    const maxFreePlays = 3;
    const playsRemaining = Math.max(0, maxFreePlays - freeGamePlaysUsed);

    // Premium users have unlimited access
    if (isPremium) {
      return res.json({
        canAccess: true,
        isPremium: true,
        playsRemaining: -1, // -1 means unlimited
        playsUsed: 0,
        maxPlays: -1
      });
    }

    // Free users check
    const canAccess = freeGamePlaysUsed < maxFreePlays;

    res.json({
      canAccess,
      isPremium: false,
      playsRemaining,
      playsUsed: freeGamePlaysUsed,
      maxPlays: maxFreePlays
    });

  } catch (error) {
    console.error('Error checking game access:', error);
    res.status(500).json({ error: 'Lỗi server khi kiểm tra quyền truy cập game' });
  }
});

// Increment play count when user opens the game
router.post('/game/increment-play', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }

    const isPremium = user.isPremium && (!user.premiumExpiresAt || user.premiumExpiresAt > new Date());

    // Premium users don't need to increment
    if (isPremium) {
      return res.json({
        success: true,
        isPremium: true,
        playsRemaining: -1
      });
    }

    // Check if user still has plays remaining
    const freeGamePlaysUsed = user.freeGamePlaysUsed || 0;
    const maxFreePlays = 3;

    if (freeGamePlaysUsed >= maxFreePlays) {
      return res.status(403).json({ 
        error: 'Bạn đã hết lượt chơi miễn phí',
        canAccess: false,
        playsRemaining: 0,
        maxPlays: maxFreePlays
      });
    }

    // Increment the play count
    user.freeGamePlaysUsed = freeGamePlaysUsed + 1;
    await user.save();

    const playsRemaining = Math.max(0, maxFreePlays - user.freeGamePlaysUsed);

    res.json({
      success: true,
      isPremium: false,
      playsRemaining,
      playsUsed: user.freeGamePlaysUsed,
      maxPlays: maxFreePlays
    });

  } catch (error) {
    console.error('Error incrementing play count:', error);
    res.status(500).json({ error: 'Lỗi server khi cập nhật lượt chơi' });
  }
});

module.exports = router;
