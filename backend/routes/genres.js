const express = require("express");
const Genre = require("../models/Genre");
const Song = require("../models/Song");

const router = express.Router();

// GET /api/genres → lấy tất cả genres
router.get("/", async (req, res) => {
  try {
    const genres = await Genre.find().sort({ name: 1 });
    res.json(genres);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/genres → thêm thể loại mới
router.post("/", async (req, res) => {
  try {
    const { name, slug, description, cover } = req.body;
    if (!name) return res.status(400).json({ error: "'name' is required" });

    const genre = new Genre({ name, slug, description, cover });
    await genre.save();
    res.status(201).json(genre);
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ error: "Genre name already exists" });
    }
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

module.exports = router;


