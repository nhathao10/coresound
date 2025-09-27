const express = require("express");
const Genre = require("../models/Genre");
const Song = require("../models/Song");
const Album = require("../models/Album");
const multer = require("multer");
const path = require("path");

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/genres/"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// GET /api/genres → lấy tất cả genres
router.get("/", async (req, res) => {
  try {
    const genres = await Genre.find().sort({ name: 1 });
    res.json(genres);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/genres → thêm thể loại mới (với file upload)
router.post("/", upload.single("cover"), async (req, res) => {
  try {
    console.log("Request body:", req.body);
    console.log("Request file:", req.file);
    console.log("Request headers:", req.headers);
    
    // Kiểm tra nếu req.body là undefined hoặc null
    if (!req.body || typeof req.body !== 'object') {
      console.error("req.body is not an object:", req.body);
      return res.status(400).json({ error: "Request body is not properly formatted" });
    }
    
    const name = req.body.name;
    const slug = req.body.slug;
    const description = req.body.description;
    
    if (!name) return res.status(400).json({ error: "'name' is required" });

    const coverPath = req.file ? `/uploads/genres/${req.file.filename}` : undefined;
    const genre = new Genre({ name, slug, description, cover: coverPath });
    await genre.save();
    res.status(201).json(genre);
  } catch (err) {
    console.error("Error creating genre:", err);
    if (err && err.code === 11000) {
      return res.status(409).json({ error: "Genre name already exists" });
    }
    res.status(500).json({ error: err.message });
  }
});

// GET /api/genres/:id → lấy thể loại theo ID
router.get("/:id", async (req, res) => {
  try {
    const genre = await Genre.findById(req.params.id);
    if (!genre) return res.status(404).json({ error: "Genre not found" });
    res.json(genre);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/genres/:id → cập nhật thể loại
router.put("/:id", async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: "Request body is required" });
    }
    const { name, slug, description } = req.body;
    const genre = await Genre.findByIdAndUpdate(
      req.params.id,
      { name, slug, description },
      { new: true, runValidators: true }
    );
    if (!genre) return res.status(404).json({ error: "Genre not found" });
    res.json(genre);
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ error: "Genre name already exists" });
    }
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/genres/:id/cover → cập nhật ảnh bìa thể loại
router.patch("/:id/cover", upload.single("cover"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No cover file provided" });
    
    const coverPath = `/uploads/genres/${req.file.filename}`;
    const genre = await Genre.findByIdAndUpdate(
      req.params.id,
      { cover: coverPath },
      { new: true }
    );
    if (!genre) return res.status(404).json({ error: "Genre not found" });
    res.json(genre);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/genres/:id → xóa thể loại
router.delete("/:id", async (req, res) => {
  try {
    const genre = await Genre.findByIdAndDelete(req.params.id);
    if (!genre) return res.status(404).json({ error: "Genre not found" });
    
    // Remove genre from all songs and albums
    await Song.updateMany({ genre: req.params.id }, { $unset: { genre: 1 } });
    await Album.updateMany({ genres: req.params.id }, { $pull: { genres: req.params.id } });
    
    res.json({ message: "Genre deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/genres/:id/songs → lấy danh sách bài hát theo 1 thể loại cụ thể
router.get("/:id/songs", async (req, res) => {
  try {
    const { id } = req.params;
    const songs = await Song.find({ genre: id }).populate("album").populate("genre");
    res.json(songs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/genres/:id/albums → lấy danh sách album theo 1 thể loại cụ thể
router.get("/:id/albums", async (req, res) => {
  try {
    const { id } = req.params;
    const albums = await Album.find({ genres: id }).populate("genres");
    res.json(albums);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;


