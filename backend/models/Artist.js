const mongoose = require("mongoose");

const ArtistSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true }, // đường dẫn thân thiện
    avatar: { type: String }, // ảnh đại diện
    bio: { type: String }, // tiểu sử
    genres: [{ type: mongoose.Schema.Types.ObjectId, ref: "Genre" }], // các thể loại
    country: { type: String }, // quốc gia
    debutYear: { type: Number }, // năm debut
    followers: { type: Number, default: 0 }, // số người theo dõi
    monthlyListeners: { type: Number, default: 0 }, // số người nghe hàng tháng
    isVerified: { type: Boolean, default: false }, // nghệ sĩ được xác thực
    socialLinks: {
      website: { type: String },
      instagram: { type: String },
      twitter: { type: String },
      facebook: { type: String },
      youtube: { type: String }
    }
  },
  { timestamps: true }
);

// Tạo index cho slug để tìm kiếm nhanh
ArtistSchema.index({ slug: 1 });

module.exports = mongoose.model("Artist", ArtistSchema);
