const express = require("express");
const router = express.Router();
const Artist = require("../models/Artist");
const multer = require("multer");
const path = require("path");

// Cấu hình multer cho upload ảnh
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/artists/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// Tạo slug từ tên nghệ sĩ
const createSlug = (name) => {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Loại bỏ dấu
    .replace(/[^a-z0-9\s-]/g, "") // Chỉ giữ chữ cái, số, khoảng trắng và dấu gạch ngang
    .replace(/\s+/g, "-") // Thay khoảng trắng bằng dấu gạch ngang
    .replace(/-+/g, "-") // Loại bỏ dấu gạch ngang liên tiếp
    .trim();
};

// GET /api/artists - Lấy danh sách tất cả nghệ sĩ
router.get("/", async (req, res) => {
  try {
    const artists = await Artist.find()
      .populate("genres")
      .sort({ createdAt: -1 });
    res.json(artists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/artists/:id - Lấy thông tin nghệ sĩ theo ID
router.get("/:id", async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id).populate("genres");
    if (!artist) {
      return res.status(404).json({ error: "Artist not found" });
    }
    res.json(artist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/artists/slug/:slug - Lấy thông tin nghệ sĩ theo slug
router.get("/slug/:slug", async (req, res) => {
  try {
    const artist = await Artist.findOne({ slug: req.params.slug }).populate("genres");
    if (!artist) {
      return res.status(404).json({ error: "Artist not found" });
    }
    res.json(artist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/artists - Tạo nghệ sĩ mới
router.post("/", upload.single("avatar"), async (req, res) => {
  try {
    const {
      name,
      bio,
      genres,
      country,
      debutYear,
      followers,
      monthlyListeners,
      isVerified,
      socialLinks
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    const slug = createSlug(name);
    
    // Kiểm tra slug đã tồn tại chưa
    const existingArtist = await Artist.findOne({ slug });
    if (existingArtist) {
      return res.status(400).json({ error: "Artist with this name already exists" });
    }

    const artistData = {
      name,
      slug,
      bio,
      genres: genres ? JSON.parse(genres) : [],
      country,
      debutYear: debutYear ? parseInt(debutYear) : undefined,
      followers: followers ? parseInt(followers) : 0,
      monthlyListeners: monthlyListeners ? parseInt(monthlyListeners) : 0,
      isVerified: isVerified === "true",
      socialLinks: socialLinks ? JSON.parse(socialLinks) : {}
    };

    if (req.file) {
      artistData.avatar = `/uploads/artists/${req.file.filename}`;
    }

    const artist = new Artist(artistData);
    await artist.save();
    
    const populatedArtist = await Artist.findById(artist._id).populate("genres");
    res.status(201).json(populatedArtist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/artists/:id - Cập nhật nghệ sĩ
router.put("/:id", upload.single("avatar"), async (req, res) => {
  try {
    const {
      name,
      bio,
      genres,
      country,
      debutYear,
      followers,
      monthlyListeners,
      isVerified,
      socialLinks
    } = req.body;

    const updateData = {
      bio,
      genres: genres ? JSON.parse(genres) : [],
      country,
      debutYear: debutYear ? parseInt(debutYear) : undefined,
      followers: followers ? parseInt(followers) : 0,
      monthlyListeners: monthlyListeners ? parseInt(monthlyListeners) : 0,
      isVerified: isVerified === "true",
      socialLinks: socialLinks ? JSON.parse(socialLinks) : {}
    };

    // Nếu tên thay đổi, tạo slug mới
    if (name) {
      const slug = createSlug(name);
      const existingArtist = await Artist.findOne({ slug, _id: { $ne: req.params.id } });
      if (existingArtist) {
        return res.status(400).json({ error: "Artist with this name already exists" });
      }
      updateData.name = name;
      updateData.slug = slug;
    }

    if (req.file) {
      updateData.avatar = `/uploads/artists/${req.file.filename}`;
    }

    const artist = await Artist.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate("genres");

    if (!artist) {
      return res.status(404).json({ error: "Artist not found" });
    }

    res.json(artist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/artists/:id - Xóa nghệ sĩ
router.delete("/:id", async (req, res) => {
  try {
    const artist = await Artist.findByIdAndDelete(req.params.id);
    if (!artist) {
      return res.status(404).json({ error: "Artist not found" });
    }
    res.json({ message: "Artist deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/artists/:id/follow - Follow/Unfollow an artist
router.post("/:id/follow", async (req, res) => {
  try {
    const { action } = req.body; // 'follow' or 'unfollow'
    const artist = await Artist.findById(req.params.id);
    
    if (!artist) {
      return res.status(404).json({ error: "Artist not found" });
    }

    if (action === "follow") {
      artist.followers = (artist.followers || 0) + 1;
    } else if (action === "unfollow") {
      artist.followers = Math.max((artist.followers || 0) - 1, 0);
    } else {
      return res.status(400).json({ error: 'Invalid action. Use "follow" or "unfollow"' });
    }

    await artist.save();
    res.json({ 
      message: `Artist ${action}ed successfully`,
      followers: artist.followers 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
