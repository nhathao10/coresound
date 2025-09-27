const mongoose = require("mongoose");

const RegionSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, unique: true, sparse: true },
  description: { type: String },
  cover: { type: String }, // đường dẫn ảnh bìa
  flag: { type: String }, // đường dẫn ảnh cờ quốc gia
}, { timestamps: true });

module.exports = mongoose.model("Region", RegionSchema);
