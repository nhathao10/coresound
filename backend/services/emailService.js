const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Send Premium Activation Email
 */
const sendPremiumActivationEmail = async (userEmail, userName, plan, expiresAt) => {
  try {
    // Create transporter directly
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    
    // Format expiration date
    const expirationDate = new Date(expiresAt).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const planName = plan === 'monthly' ? '1 Tháng' : '1 Năm';
    const planPrice = plan === 'monthly' ? '30,000 VNĐ' : '300,000 VNĐ';

    const mailOptions = {
      from: {
        name: 'CoreSound Music',
        address: process.env.EMAIL_USER
      },
      to: userEmail,
      subject: '🎉 Chúc mừng! Tài khoản Premium đã được kích hoạt',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #0f0f0f;
      color: #ffffff;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background: linear-gradient(135deg, #1a1a1f 0%, #2d2d35 100%);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    }
    .header {
      background: linear-gradient(135deg, #1db954 0%, #1ed760 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      color: #ffffff;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    .crown-icon {
      font-size: 48px;
      margin-bottom: 10px;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
      color: #ffffff;
    }
    .message {
      font-size: 16px;
      line-height: 1.6;
      color: #b3b3b3;
      margin-bottom: 30px;
    }
    .plan-details {
      background: rgba(29, 185, 84, 0.1);
      border: 2px solid #1db954;
      border-radius: 12px;
      padding: 25px;
      margin: 30px 0;
    }
    .plan-details h2 {
      margin: 0 0 20px 0;
      font-size: 20px;
      color: #1db954;
      font-weight: 600;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      color: #b3b3b3;
      font-size: 14px;
    }
    .detail-value {
      color: #ffffff;
      font-weight: 600;
      font-size: 14px;
    }
    .features {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 25px;
      margin: 30px 0;
    }
    .features h3 {
      margin: 0 0 15px 0;
      font-size: 18px;
      color: #ffffff;
      font-weight: 600;
    }
    .feature-item {
      display: flex;
      align-items: center;
      padding: 10px 0;
      color: #b3b3b3;
      font-size: 14px;
    }
    .feature-icon {
      color: #1db954;
      margin-right: 12px;
      font-size: 18px;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #1db954 0%, #1ed760 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 50px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
      box-shadow: 0 4px 15px rgba(29, 185, 84, 0.4);
      transition: all 0.3s ease;
    }
    .footer {
      background: rgba(0, 0, 0, 0.3);
      padding: 30px;
      text-align: center;
      color: #666;
      font-size: 13px;
      line-height: 1.6;
    }
    .footer a {
      color: #1db954;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="header">
      <div class="crown-icon">👑</div>
      <h1>Chào mừng đến với CoreSound Premium!</h1>
    </div>

    <!-- Content -->
    <div class="content">
      <div class="greeting">
        Xin chào <strong>${userName}</strong>,
      </div>

      <div class="message">
        Cảm ơn bạn đã nâng cấp lên <strong>CoreSound Premium</strong>! 🎉
        <br><br>
        Tài khoản Premium của bạn đã được kích hoạt thành công và bạn giờ đây có thể tận hưởng trọn vẹn trải nghiệm âm nhạc không giới hạn.
      </div>

      <!-- Plan Details -->
      <div class="plan-details">
        <h2>📋 Chi tiết gói Premium</h2>
        <div class="detail-row">
          <span class="detail-label">Gói đăng ký:</span>
          <span class="detail-value">Premium ${planName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Giá trị:</span>
          <span class="detail-value">${planPrice}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Ngày kích hoạt:</span>
          <span class="detail-value">${new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Hết hạn:</span>
          <span class="detail-value">${expirationDate}</span>
        </div>
      </div>

      <!-- Features -->
      <div class="features">
        <h3>✨ Đặc quyền Premium của bạn:</h3>
        <div class="feature-item">
          <span class="feature-icon">✓</span>
          Nghe nhạc chất lượng cao không giới hạn
        </div>
        <div class="feature-item">
          <span class="feature-icon">✓</span>
          Tải nhạc offline để nghe mọi lúc mọi nơi
        </div>
        <div class="feature-item">
          <span class="feature-icon">✓</span>
          Không quảng cáo - Trải nghiệm mượt mà
        </div>
        <div class="feature-item">
          <span class="feature-icon">✓</span>
          Tạo playlist không giới hạn
        </div>
        <div class="feature-item">
          <span class="feature-icon">✓</span>
          Chơi minigame đoán bài hát không giới hạn
        </div>
        <div class="feature-item">
          <span class="feature-icon">✓</span>
          Xem lời bài hát đồng bộ (Karaoke mode)
        </div>
        <div class="feature-item">
          <span class="feature-icon">✓</span>
          Truy cập các bài hát Premium độc quyền
        </div>
      </div>

      <div style="text-align: center;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="cta-button">
          Bắt đầu nghe nhạc ngay →
        </a>
      </div>

      <div class="message" style="margin-top: 30px;">
        Nếu bạn có bất kỳ câu hỏi nào, đừng ngần ngại liên hệ với chúng tôi.
        <br><br>
        Chúc bạn có những trải nghiệm âm nhạc tuyệt vời! 🎵
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <strong>CoreSound Music Platform</strong>
      <br>
      Email: <a href="mailto:support@coresound.com">support@coresound.com</a>
      <br>
      <br>
      © ${new Date().getFullYear()} CoreSound. All rights reserved.
      <br>
      Đây là email tự động, vui lòng không reply trực tiếp.
    </div>
  </div>
</body>
</html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Premium activation email sent to ${userEmail} - Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Error sending premium activation email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send Premium Expiration Reminder Email
 */
const sendPremiumExpirationReminder = async (userEmail, userName, daysLeft) => {
  try {
    // Create transporter directly
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    const mailOptions = {
      from: {
        name: 'CoreSound Music',
        address: process.env.EMAIL_USER
      },
      to: userEmail,
      subject: `⏰ Gói Premium của bạn sắp hết hạn - Còn ${daysLeft} ngày`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; }
    .header { text-align: center; color: #ff9500; margin-bottom: 20px; }
    .content { line-height: 1.6; color: #333; }
    .button { display: inline-block; background: #1db954; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Gói Premium sắp hết hạn</h1>
    </div>
    <div class="content">
      <p>Xin chào <strong>${userName}</strong>,</p>
      <p>Gói <strong>CoreSound Premium</strong> của bạn sẽ hết hạn trong <strong>${daysLeft} ngày</strong> nữa.</p>
      <p>Gia hạn ngay để tiếp tục tận hưởng:</p>
      <ul>
        <li>Nghe nhạc chất lượng cao không giới hạn</li>
        <li>Tải nhạc offline</li>
        <li>Không quảng cáo</li>
        <li>Và nhiều đặc quyền khác...</li>
      </ul>
      <div style="text-align: center;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/#/profile" class="button">Gia hạn ngay</a>
      </div>
      <p>Cảm ơn bạn đã sử dụng CoreSound!</p>
    </div>
  </div>
</body>
</html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Expiration reminder sent to ${userEmail}`);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Error sending expiration reminder:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendPremiumActivationEmail,
  sendPremiumExpirationReminder
};

