const cron = require('node-cron');
const Song = require('../models/Song');

// Reset weeklyPlays mỗi Chủ nhật lúc 00:00
const scheduleWeeklyReset = () => {
  // Cron expression: '0 0 * * 0' = 00:00 mỗi Chủ nhật
  cron.schedule('0 0 * * 0', async () => {
    try {
      console.log('[Weekly Reset] Starting weekly plays reset...');
      
      const result = await Song.updateMany(
        {},
        { $set: { weeklyPlays: 0 } }
      );
      
      console.log(`[Weekly Reset] Successfully reset ${result.modifiedCount} songs`);
      console.log(`[Weekly Reset] Next reset: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleString()}`);
    } catch (error) {
      console.error('[Weekly Reset] Error resetting weekly plays:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh" // Múi giờ Việt Nam
  });

  console.log('[Weekly Reset] Scheduler initialized - will reset every Sunday at 00:00 (GMT+7)');
};

// Kiểm tra và reset nếu đã qua tuần mới
const checkAndResetIfNeeded = async () => {
  try {
    // Lấy một bài hát bất kỳ để kiểm tra lastWeeklyReset
    const anySong = await Song.findOne().select('lastWeeklyReset');
    
    if (!anySong) {
      console.log('[Weekly Reset] No songs found in database');
      return;
    }

    // Nếu chưa có lastWeeklyReset hoặc đã qua 7 ngày
    const now = new Date();
    const lastReset = anySong.lastWeeklyReset || new Date(0);
    const daysSinceReset = (now - lastReset) / (1000 * 60 * 60 * 24);

    if (daysSinceReset >= 7) {
      console.log(`[Weekly Reset] ${daysSinceReset.toFixed(1)} days since last reset. Resetting now...`);
      
      const result = await Song.updateMany(
        {},
        { 
          $set: { 
            weeklyPlays: 0,
            lastWeeklyReset: now
          } 
        }
      );
      
      console.log(`[Weekly Reset] Reset ${result.modifiedCount} songs on startup`);
    } else {
      console.log(`[Weekly Reset] Last reset was ${daysSinceReset.toFixed(1)} days ago. No reset needed.`);
    }
  } catch (error) {
    console.error('[Weekly Reset] Error checking reset status:', error);
  }
};

module.exports = {
  scheduleWeeklyReset,
  checkAndResetIfNeeded
};
