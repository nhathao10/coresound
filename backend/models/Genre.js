const mongoose = require("mongoose");

const GenreSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, trim: true },
    description: { type: String },
    cover: { type: String },
  },
  { timestamps: true }
);

// Ensure unique index on name
GenreSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model("Genre", GenreSchema);


