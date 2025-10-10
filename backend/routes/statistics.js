const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Song = require('../models/Song');
const Album = require('../models/Album');
const Artist = require('../models/Artist');
const CuratedPlaylist = require('../models/CuratedPlaylist');
const UserPlaylist = require('../models/UserPlaylist');
const ListeningHistory = require('../models/ListeningHistory');
const Favorite = require('../models/Favorite');
const Comment = require('../models/Comment');
const Rating = require('../models/Rating');
const { protect } = require('../middleware/auth');

// Middleware kiểm tra admin
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Không có quyền truy cập' });
  }
  next();
};

// Thống kê tổng quan
router.get('/overview', protect, requireAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      totalSongs,
      totalAlbums,
      totalArtists,
      totalCuratedPlaylists,
      totalUserPlaylists,
      totalComments,
      totalRatings,
      totalFavorites
    ] = await Promise.all([
      User.countDocuments(),
      Song.countDocuments(),
      Album.countDocuments(),
      Artist.countDocuments(),
      CuratedPlaylist.countDocuments(),
      UserPlaylist.countDocuments(),
      Comment.countDocuments(),
      Rating.countDocuments(),
      Favorite.countDocuments()
    ]);

    const totalPlaylists = totalCuratedPlaylists + totalUserPlaylists;


    // Thống kê người dùng mới trong 30 ngày qua
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Thống kê bài hát được nghe nhiều nhất - sử dụng Song.plays thay vì ListeningHistory
    const topSongsData = await Song.find({ plays: { $gt: 0 } })
      .sort({ plays: -1 })
      .limit(5)
      .select('_id title artist plays')
      .lean();

    // Format để match với frontend
    const topSongs = topSongsData.map(song => ({
      _id: song._id,
      title: song.title,
      artist: song.artist,
      playCount: song.plays || 0
    }));

    res.json({
      overview: {
        totalUsers,
        totalSongs,
        totalAlbums,
        totalArtists,
        totalPlaylists,
        totalComments,
        totalRatings,
        totalFavorites,
        newUsers
      },
      topSongs
    });
  } catch (error) {
    console.error('Lỗi khi lấy thống kê tổng quan:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Thống kê theo thời gian
router.get('/time-based', protect, requireAdmin, async (req, res) => {
  try {
    const { period = '7d' } = req.query; // 7d, 30d, 90d, 1y
    
    let days;
    switch (period) {
      case '7d': days = 7; break;
      case '30d': days = 30; break;
      case '90d': days = 90; break;
      case '1y': days = 365; break;
      default: days = 7;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Thống kê người dùng đăng ký theo thời gian
    const userRegistrations = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Thống kê lượt nghe theo thời gian
    const listeningStats = await ListeningHistory.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    res.json({
      period,
      userRegistrations,
      listeningStats
    });
  } catch (error) {
    console.error('Lỗi khi lấy thống kê theo thời gian:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Thống kê theo thể loại
router.get('/by-genre', protect, requireAdmin, async (req, res) => {
  try {
    const genreStats = await Song.aggregate([
      { $unwind: '$genres' },
      {
        $lookup: {
          from: 'genres',
          localField: 'genres',
          foreignField: '_id',
          as: 'genreInfo'
        }
      },
      { $unwind: '$genreInfo' },
      {
        $group: {
          _id: '$genres',
          genreName: { $first: '$genreInfo.name' },
          songCount: { $sum: 1 },
          totalPlays: { $sum: '$playCount' }
        }
      },
      { $sort: { songCount: -1 } },
      { $limit: 10 }
    ]);

    res.json(genreStats);
  } catch (error) {
    console.error('Lỗi khi lấy thống kê theo thể loại:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Thống kê theo nghệ sĩ
router.get('/by-artist', protect, requireAdmin, async (req, res) => {
  try {
    const artistStats = await Song.aggregate([
      {
        $group: {
          _id: '$artist',
          songCount: { $sum: 1 },
          totalPlays: { $sum: '$playCount' }
        }
      },
      { $sort: { totalPlays: -1 } },
      { $limit: 10 }
    ]);

    res.json(artistStats);
  } catch (error) {
    console.error('Lỗi khi lấy thống kê theo nghệ sĩ:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});


// Thống kê theo thời gian
router.get('/time-based', protect, requireAdmin, async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    let days;
    switch (period) {
      case '7d': days = 7; break;
      case '30d': days = 30; break;
      case '90d': days = 90; break;
      case '1y': days = 365; break;
      default: days = 7;
    }
    
    // Sử dụng khoảng thời gian hợp lý
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const endDate = new Date(); // Chỉ lấy dữ liệu đến hiện tại

    // Đăng ký người dùng theo thời gian
    const userRegistrations = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    res.json({
      userRegistrations,
      listeningStats: [] // Không sử dụng listening stats nữa
    });
  } catch (error) {
    console.error('Lỗi khi lấy thống kê theo thời gian:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Thống kê người dùng hoạt động
router.get('/user-activity', protect, requireAdmin, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Người dùng có nhiều lượt nghe nhất
    const topListeners = await ListeningHistory.aggregate([
      { $group: { _id: '$user', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) },
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
          username: '$user.username',
          email: '$user.email',
          listenCount: '$count'
        }
      }
    ]);

    // Người dùng có nhiều playlist nhất (chỉ tính UserPlaylist)
    const topPlaylistCreators = await UserPlaylist.aggregate([
      { $group: { _id: '$user', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) },
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
          username: '$user.username',
          email: '$user.email',
          playlistCount: '$count'
        }
      }
    ]);

    res.json({
      topListeners,
      topPlaylistCreators
    });
  } catch (error) {
    console.error('Lỗi khi lấy thống kê người dùng:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;
