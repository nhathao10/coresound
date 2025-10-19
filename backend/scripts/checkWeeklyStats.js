/**
 * Quick Check Weekly Stats
 * Hiển thị thống kê nhanh về weeklyPlays
 * Usage: node scripts/checkWeeklyStats.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Song = require('../models/Song');

async function checkStats() {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/coresound';
    await mongoose.connect(mongoURI);

    const totalSongs = await Song.countDocuments();
    const songsWithPlays = await Song.countDocuments({ weeklyPlays: { $gt: 0 } });
    
    const topSongs = await Song.find()
      .sort({ weeklyPlays: -1 })
      .limit(5)
      .select('title artist weeklyPlays');

    console.log('\n📊 Weekly Stats:');
    console.log(`   Total songs: ${totalSongs}`);
    console.log(`   Songs with plays: ${songsWithPlays}`);
    console.log('\n🏆 Top 5:');
    topSongs.forEach((song, i) => {
      console.log(`   ${i + 1}. ${song.title} - ${song.artist} (${song.weeklyPlays} plays)`);
    });
    console.log('');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkStats();
