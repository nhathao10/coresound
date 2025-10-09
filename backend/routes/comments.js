const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const { protect } = require('../middleware/auth');

// GET /api/albums/:albumId/comments - Get all comments for an album
router.get('/:albumId/comments', async (req, res) => {
  try {
    const { albumId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const comments = await Comment.find({ album: albumId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('userName userAvatar content createdAt user');

    const total = await Comment.countDocuments({ album: albumId });

    res.json({
      comments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// POST /api/albums/:albumId/comments - Create a new comment
router.post('/:albumId/comments', protect, async (req, res) => {
  try {
    const { albumId } = req.params;
    const { content, userId, userName, userAvatar } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Nội dung bình luận không được để trống' });
    }

    if (content.length > 1000) {
      return res.status(400).json({ error: 'Bình luận không được quá 1000 ký tự' });
    }

    const comment = new Comment({
      album: albumId,
      user: userId,
      userName: userName,
      userAvatar: userAvatar,
      content: content.trim()
    });

    await comment.save();

    res.status(201).json({
      message: 'Bình luận đã được đăng thành công',
      comment: {
        _id: comment._id,
        userName: comment.userName,
        userAvatar: comment.userAvatar,
        content: comment.content,
        createdAt: comment.createdAt
      }
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// PUT /api/albums/:albumId/comments/:commentId - Update a comment
router.put('/:albumId/comments/:commentId', protect, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Nội dung bình luận không được để trống' });
    }

    if (content.length > 1000) {
      return res.status(400).json({ error: 'Bình luận không được quá 1000 ký tự' });
    }

    const comment = await Comment.findOne({ _id: commentId, user: userId });
    
    if (!comment) {
      return res.status(404).json({ error: 'Bình luận không tồn tại hoặc bạn không có quyền chỉnh sửa' });
    }

    comment.content = content.trim();
    await comment.save();

    res.json({ 
      message: 'Bình luận đã được cập nhật thành công',
      comment: {
        _id: comment._id,
        userName: comment.userName,
        content: comment.content,
        createdAt: comment.createdAt
      }
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

// DELETE /api/albums/:albumId/comments/:commentId - Delete a comment
router.delete('/:albumId/comments/:commentId', protect, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    const comment = await Comment.findOne({ _id: commentId, user: userId });
    
    if (!comment) {
      return res.status(404).json({ error: 'Bình luận không tồn tại hoặc bạn không có quyền xóa' });
    }

    await Comment.findByIdAndDelete(commentId);

    res.json({ message: 'Bình luận đã được xóa thành công' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

module.exports = router;
