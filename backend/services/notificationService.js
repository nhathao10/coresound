const Notification = require('../models/Notification');
const User = require('../models/User');

class NotificationService {
  // Tạo thông báo cho tất cả user theo dõi nghệ sĩ
  // CHỈ gọi khi nghệ sĩ phát hành bài hát mới (tạo bài hát mới)
  // KHÔNG gọi khi bài hát được thêm vào album
  static async notifyNewSong(artistId, songData) {
    try {
      // Tìm tất cả user theo dõi nghệ sĩ này
      const followers = await User.find({
        followedArtists: artistId
      });

      if (followers.length === 0) {
        return;
      }

      // Tạo thông báo cho từng follower
      const notifications = followers.map(follower => ({
        user: follower._id,
        type: 'new_song',
        title: 'Bài hát mới từ nghệ sĩ bạn theo dõi',
        message: `${songData.artistName} vừa phát hành bài hát "${songData.title}"`,
        data: {
          artistId: artistId,
          songId: songData._id,
          artistName: songData.artistName,
          songTitle: songData.title,
          songCover: songData.cover
        },
        isRead: false
      }));

      await Notification.insertMany(notifications);
      
      return notifications.length;
    } catch (error) {
      console.error('Error creating song notifications:', error);
      throw error;
    }
  }

  // Tạo thông báo cho tất cả user theo dõi nghệ sĩ khi có album mới
  // CHỈ gọi khi nghệ sĩ phát hành album mới (tạo album mới)
  // KHÔNG gọi khi bài hát được thêm vào album
  static async notifyNewAlbum(artistId, albumData) {
    try {
      // Tìm tất cả user theo dõi nghệ sĩ này
      const followers = await User.find({
        followedArtists: artistId
      });

      if (followers.length === 0) {
        return;
      }

      // Tạo thông báo cho từng follower
      const notifications = followers.map(follower => ({
        user: follower._id,
        type: 'new_album',
        title: 'Album mới từ nghệ sĩ bạn theo dõi',
        message: `${albumData.artistName} vừa phát hành album "${albumData.title}"`,
        data: {
          artistId: artistId,
          albumId: albumData._id,
          artistName: albumData.artistName,
          albumTitle: albumData.title,
          albumCover: albumData.cover
        },
        isRead: false
      }));

      await Notification.insertMany(notifications);
      
      return notifications.length;
    } catch (error) {
      console.error('Error creating album notifications:', error);
      throw error;
    }
  }

  // Tạo thông báo khi nghệ sĩ cập nhật thông tin
  static async notifyArtistUpdate(artistId, artistData) {
    try {
      // Tìm tất cả user theo dõi nghệ sĩ này
      const followers = await User.find({
        followedArtists: artistId
      });

      if (followers.length === 0) {
        return;
      }

      // Tạo thông báo cho từng follower
      const notifications = followers.map(follower => ({
        user: follower._id,
        type: 'artist_update',
        title: 'Cập nhật từ nghệ sĩ',
        message: `${artistData.name} đã cập nhật thông tin cá nhân`,
        data: {
          artistId: artistId,
          artistName: artistData.name,
          artistAvatar: artistData.avatar
        },
        isRead: false
      }));

      await Notification.insertMany(notifications);
      
      return notifications.length;
    } catch (error) {
      console.error('Error creating artist update notifications:', error);
      throw error;
    }
  }

  // Lấy số lượng thông báo chưa đọc của user
  static async getUnreadCount(userId) {
    try {
      return await Notification.countDocuments({
        user: userId,
        isRead: false
      });
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  // Lấy thông báo của user với phân trang
  static async getUserNotifications(userId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const notifications = await Notification.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const unreadCount = await Notification.countDocuments({ 
        user: userId, 
        isRead: false 
      });

      const total = await Notification.countDocuments({ user: userId });

      return {
        notifications,
        unreadCount,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: notifications.length,
          totalCount: total
        }
      };
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;
