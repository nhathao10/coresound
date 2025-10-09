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
  region: { type: mongoose.Schema.Types.ObjectId, ref: "Region" },
  // Lyrics với timestamps
  lyrics: {
    text: { type: String, default: "" },           // Nội dung lyrics đầy đủ
    language: { type: String, default: "vi" },     // Ngôn ngữ
    hasTimestamps: { type: Boolean, default: false }, // Có timestamp hay không
    timestamps: [{
      time: { type: Number, required: true },      // Thời gian (giây)
      text: { type: String, required: true }       // Lời tại thời điểm đó
    }],
    isOfficial: { type: Boolean, default: false }, // Lyrics chính thức hay user đóng góp
    contributor: { type: mongoose.Schema.Types.ObjectId, ref: "User" } // Người đóng góp
  }
}, { timestamps: true });

module.exports = mongoose.model("Song", SongSchema);
