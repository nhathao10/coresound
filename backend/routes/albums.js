const express = require("express");
const multer = require("multer");
const Album = require("../models/Album");
const Artist = require("../models/Artist");
const NotificationService = require("../services/notificationService");

const router = express.Router();

// Storage cho ảnh cover album
const coverStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/album_covers/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const uploadCover = multer({ storage: coverStorage });

// Tạo album
router.post("/", uploadCover.single("cover"), async (req, res) => {
  try {
    const { name, artist, releaseDate, plays, genres } = req.body;
    const coverPath = req.file ? `/uploads/album_covers/${req.file.filename}` : "";
    
    // Parse genres if provided
    let genreIds = [];
    if (genres) {
      try {
        genreIds = Array.isArray(genres) ? genres : JSON.parse(genres);
      } catch (e) {
        // If parsing fails, treat as single genre ID
        genreIds = [genres];
      }
    }
    
    const album = new Album({
      name,
      artist,
      releaseDate: releaseDate ? new Date(releaseDate) : undefined,
      cover: coverPath,
      genres: genreIds,
      ...(plays !== undefined ? { plays: Math.max(0, Math.floor(Number(plays) || 0)) } : {}),
    });
    await album.save();

    // Tạo thông báo cho user theo dõi nghệ sĩ
    // CHỈ khi tạo album mới (phát hành album mới)
    try {
      // Tìm artist ID từ tên artist
      const artistDoc = await Artist.findOne({ name: artist });
      if (artistDoc) {
        await NotificationService.notifyNewAlbum(artistDoc._id, {
          _id: album._id,
          title: name,
          artistName: artist,
          cover: coverPath
        });
      }
    } catch (notificationError) {
      console.error('Error creating notifications for new album:', notificationError);
      // Không throw error để không ảnh hưởng đến việc tạo album
    }

    res.status(201).json(album);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Danh sách album
router.get("/", async (req, res) => {
  try {
    const albums = await Album.find().populate("genres").sort({ createdAt: -1 });
    res.json(albums);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Chi tiết album
router.get("/:id", async (req, res) => {
  try {
    const album = await Album.findById(req.params.id).populate("genres");
    if (!album) return res.status(404).json({ error: "Album not found" });
    res.json(album);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cập nhật album
router.put("/:id", uploadCover.single("cover"), async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: "Request body is required" });
    }
    const { name, artist, releaseDate, plays, genres } = req.body;
    const update = { name, artist };
    if (releaseDate) update.releaseDate = new Date(releaseDate);
    if (req.file) update.cover = `/uploads/album_covers/${req.file.filename}`;
    if (plays !== undefined) {
      const parsed = Math.max(0, Math.floor(Number(plays) || 0));
      update.plays = parsed;
    }
    if (genres !== undefined) {
      // Parse genres if provided
      let genreIds = [];
      if (genres) {
        try {
          genreIds = Array.isArray(genres) ? genres : JSON.parse(genres);
        } catch (e) {
          // If parsing fails, treat as single genre ID
          genreIds = [genres];
        }
      }
      update.genres = genreIds;
    }
    const album = await Album.findByIdAndUpdate(req.params.id, update, { new: true }).populate("genres");
    if (!album) return res.status(404).json({ error: "Album not found" });
    res.json(album);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Xóa album
router.delete("/:id", async (req, res) => {
  try {
    const album = await Album.findByIdAndDelete(req.params.id);
    if (!album) return res.status(404).json({ error: "Album not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;



