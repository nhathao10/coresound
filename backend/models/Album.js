const mongoose = require("mongoose");

const AlbumSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    artist: { type: String, required: true },
    releaseDate: { type: Date },
    cover: { type: String },
    plays: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Album", AlbumSchema);


