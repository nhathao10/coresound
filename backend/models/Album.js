const mongoose = require("mongoose");

const AlbumSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    artist: { type: String, required: true },
    releaseDate: { type: Date },
    cover: { type: String },
    plays: { type: Number, default: 0 },
    genres: [{ type: mongoose.Schema.Types.ObjectId, ref: "Genre" }],
  },
  // Add index for performance
AlbumSchema.index({ plays: -1 });
AlbumSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Album", AlbumSchema);


