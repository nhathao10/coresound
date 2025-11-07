const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendPremiumActivationEmail } = require('../services/emailService');
require('dotenv').config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Middleware to protect routes
const protect = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (!token) {
    return res.status(401).json({ error: 'Không được phép, không có token' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(decoded.userId).select('-password');
    
    if (!req.user) {
      return res.status(401).json({ error: 'Token không hợp lệ, người dùng không tồn tại' });
    }
    
    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    return res.status(401).json({ error: 'Không được phép, token không hợp lệ' });
  }
};

// @route   POST /api/premium/create-checkout-session
// @desc    Create Stripe Checkout Session
// @access  Private
router.post('/create-checkout-session', protect, async (req, res) => {
  try {
    const { plan } = req.body; // plan: 'monthly' or 'yearly'
    
    if (!plan || !['monthly', 'yearly'].includes(plan)) {
      return res.status(400).json({ error: 'Gói Premium không hợp lệ' });
    }

    // Define pricing
    const prices = {
      monthly: {
        amount: 30000, // 30,000 VNĐ
        name: 'CoreSound Premium 1 tháng',
        duration: 'monthly'
      },
      yearly: {
        amount: 300000, // 300,000 VNĐ
        name: 'CoreSound Premium 1 năm',
        duration: 'yearly'
      }
    };

    const selectedPrice = prices[plan];

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'vnd',
            product_data: {
              name: selectedPrice.name,
              description: plan === 'monthly' 
                ? 'Nghe nhạc không quảng cáo, chất lượng cao, tải offline'
                : 'Nghe nhạc không quảng cáo, chất lượng cao, tải offline - Tiết kiệm 17%',
            },
            unit_amount: selectedPrice.amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${FRONTEND_URL}/#/premium-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/#/profile`,
      client_reference_id: req.user._id.toString(),
      metadata: {
        userId: req.user._id.toString(),
        plan: plan,
        duration: selectedPrice.duration
      }
    });

    console.log(`🔗 Checkout session created for ${req.user.email} - Plan: ${plan}`);

    res.json({
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({ error: 'Không thể tạo phiên thanh toán' });
  }
});

// @route   POST /api/premium/verify-session
// @desc    Verify payment and activate premium
// @access  Private
router.post('/verify-session', protect, async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID không hợp lệ' });
    }

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Verify payment status
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Thanh toán chưa hoàn tất' });
    }

    // Verify user
    if (session.metadata.userId !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Session không thuộc về người dùng này' });
    }

    // Calculate expiration date
    const now = new Date();
    const expiresAt = new Date(now);
    const plan = session.metadata.plan;
    
    if (plan === 'monthly') {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else if (plan === 'yearly') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    }

    // Check if already premium to avoid sending duplicate emails
    const currentUser = await User.findById(req.user._id);
    const wasAlreadyPremium = currentUser.isPremium;

    // Update user premium status
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        isPremium: true,
        premiumExpiresAt: expiresAt
      },
      { new: true }
    ).select('-password');

    console.log(`✅ Premium activated for ${updatedUser.email} until ${expiresAt.toLocaleDateString('vi-VN')} - Session: ${sessionId}`);

    // Send activation email ONLY if this is a NEW premium activation (not already premium)
    if (!wasAlreadyPremium) {
      sendPremiumActivationEmail(
        updatedUser.email,
        updatedUser.name,
        plan,
        expiresAt
      ).catch(emailError => {
        // Log error but don't fail the request
        console.error('Email sending failed (non-critical):', emailError);
      });
      console.log(`📧 Sending premium activation email to ${updatedUser.email}...`);
    } else {
      console.log(`⏭️  User ${updatedUser.email} already premium, skipping email`);
    }

    res.json({
      message: 'Nâng cấp Premium thành công',
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isPremium: updatedUser.isPremium,
        premiumExpiresAt: updatedUser.premiumExpiresAt,
        avatar: updatedUser.avatar,
        gender: updatedUser.gender,
        dateOfBirth: updatedUser.dateOfBirth
      }
    });
  } catch (error) {
    console.error('Verify session error:', error);
    res.status(500).json({ error: 'Không thể xác minh thanh toán' });
  }
});

// @route   GET /api/premium/status
// @desc    Get premium status
// @access  Private
router.get('/status', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('isPremium premiumExpiresAt');
    
    // Check if premium has expired
    if (user.isPremium && user.premiumExpiresAt && new Date() > user.premiumExpiresAt) {
      // Expire premium
      user.isPremium = false;
      user.premiumExpiresAt = null;
      await user.save();
    }

    res.json({
      isPremium: user.isPremium,
      premiumExpiresAt: user.premiumExpiresAt
    });
  } catch (error) {
    console.error('Get premium status error:', error);
    res.status(500).json({ error: 'Lỗi server nội bộ' });
  }
});

module.exports = router;
