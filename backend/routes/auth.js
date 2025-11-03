const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// JWT Secret (in production, this should be in environment variables)
const JWT_SECRET = 'your-secret-key-change-in-production';

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'user' } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Tất cả các trường đều bắt buộc' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email đã được sử dụng' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role === 'admin' ? 'admin' : 'user'
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data (without password)
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
      avatar: user.avatar,
      followedArtists: user.followedArtists || [],
      isPremium: user.isPremium || false,
      premiumExpiresAt: user.premiumExpiresAt || null,
      createdAt: user.createdAt
    };

    res.status(201).json({
      message: 'Đăng ký thành công',
      user: userData,
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email và mật khẩu đều bắt buộc' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data (without password)
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
      avatar: user.avatar,
      followedArtists: user.followedArtists || [],
      isPremium: user.isPremium || false,
      premiumExpiresAt: user.premiumExpiresAt || null,
      createdAt: user.createdAt
    };

    res.json({
      message: 'Đăng nhập thành công',
      user: userData,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Verify token middleware
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Không có token' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token không hợp lệ' });
  }
};

// Get current user
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;
