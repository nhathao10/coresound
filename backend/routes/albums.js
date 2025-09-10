const express = require("express");
const multer = require("multer");
const Album = require("../models/Album");

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
    const { name, artist, releaseDate } = req.body;
    const coverPath = req.file ? `/uploads/album_covers/${req.file.filename}` : "";
    const album = new Album({
      name,
      artist,
      releaseDate: releaseDate ? new Date(releaseDate) : undefined,
      cover: coverPath,
    });
    await album.save();
    res.status(201).json(album);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Danh sách album
router.get("/", async (req, res) => {
  try {
    const albums = await Album.find().sort({ createdAt: -1 });
    res.json(albums);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Chi tiết album
router.get("/:id", async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);
    if (!album) return res.status(404).json({ error: "Album not found" });
    res.json(album);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cập nhật album
router.put("/:id", uploadCover.single("cover"), async (req, res) => {
  try {
    const { name, artist, releaseDate } = req.body;
    const update = { name, artist };
    if (releaseDate) update.releaseDate = new Date(releaseDate);
    if (req.file) update.cover = `/uploads/album_covers/${req.file.filename}`;
    const album = await Album.findByIdAndUpdate(req.params.id, update, { new: true });
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



