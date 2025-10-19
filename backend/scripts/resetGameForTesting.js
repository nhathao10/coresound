/**
 * Reset Game Script - For Testing Only
 * 
 * This script will:
 * 1. Delete all daily songs
 * 2. Delete all game results
 * 3. Allow you to play the game again from scratch
 * 
 * Usage: node scripts/resetGameForTesting.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const DailySong = require('../models/DailySong');
const GameResult = require('../models/GameResult');

async function resetGame() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/coresound';
    await mongoose.connect(mongoURI);
    console.log('✓ Connected to MongoDB\n');

    // Delete all daily songs
    const deletedSongs = await DailySong.deleteMany({});
    console.log(`✓ Deleted ${deletedSongs.deletedCount} daily songs`);

    // Delete all game results
    const deletedResults = await GameResult.deleteMany({});
    console.log(`✓ Deleted ${deletedResults.deletedCount} game results`);

    console.log('\n🎉 Game reset successfully!');
    console.log('👉 You can now play the game again from the beginning.\n');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

resetGame();
