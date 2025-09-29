const mongoose = require("mongoose");

const SongSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: { type: String, required: true },
  cover: { type: String, required: true }, // đường dẫn ảnh bìa
  url: { type: String, required: true },   // đường dẫn file nhạc mp3
  plays: { type: Number, default: 0 },     // số lượt nghe tổng cộng
  weeklyPlays: { type: Number, default: 0 }, // số lượt nghe trong 7 ngày
  lastPlayed: { type: Date, default: Date.now }, // thời gian nghe cuối cùng
  premium: { type: Boolean, default: false },
  album: { type: mongoose.Schema.Types.ObjectId, ref: "Album" },
  genres: [{ type: mongoose.Schema.Types.ObjectId, ref: "Genre" }],
  region: { type: mongoose.Schema.Types.ObjectId, ref: "Region" }
}, { timestamps: true });

module.exports = mongoose.model("Song", SongSchema);
