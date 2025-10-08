const express = require('express');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Notifications API is working!' });
});

// @route   GET /api/notifications
// @desc    Get user's notifications
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const unreadCount = await Notification.countDocuments({ 
      user: req.user._id, 
      isRead: false 
    });

    const total = await Notification.countDocuments({ user: req.user._id });

    res.json({
      notifications,
      unreadCount,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: notifications.length,
        totalCount: total
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Không tìm thấy thông báo' });
    }

    res.json({ message: 'Đã đánh dấu thông báo là đã đọc', notification });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({ message: 'Đã đánh dấu tất cả thông báo là đã đọc' });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ error: 'Không tìm thấy thông báo' });
    }

    res.json({ message: 'Đã xóa thông báo' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// @route   DELETE /api/notifications
// @desc    Delete all notifications
// @access  Private
router.delete('/', protect, async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user._id });

    res.json({ message: 'Đã xóa tất cả thông báo' });
  } catch (error) {
    console.error('Delete all notifications error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// @route   POST /api/notifications
// @desc    Create notification (for testing or admin use)
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { type, title, message, data } = req.body;
    
    if (!type || !title || !message) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
    }

    const notification = new Notification({
      user: req.user._id,
      type,
      title,
      message,
      data: data || {}
    });

    await notification.save();

    res.status(201).json({
      message: 'Đã tạo thông báo',
      notification
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

module.exports = router;
