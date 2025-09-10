const express = require("express");
const multer = require("multer");
const Song = require("../models/Song"); // ✅ sửa lại đường dẫn model

const router = express.Router();

// Storage cho ảnh cover
const coverStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/covers/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const uploadCover = multer({ storage: coverStorage });

// Storage cho file nhạc
const songStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/songs/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const uploadSong = multer({ storage: songStorage });

// Thêm bài hát mới (upload cả cover và mp3)
router.post(
  "/add",
  (req, res, next) => {
    uploadCover.single("cover")(req, res, (err) => {
      if (err) return next(err);
      uploadSong.single("song")(req, res, (err2) => {
        if (err2) return next(err2);
        next();
      });
    });
  },
  async (req, res) => {
    try {
      const { title, artist, premium, plays, albumId } = req.body;

      // Nếu có file cover và song
      const coverPath = req.files?.cover
        ? `/uploads/covers/${req.files.cover[0].filename}`
        : "";

      const songPath = req.files?.song
        ? `/uploads/songs/${req.files.song[0].filename}`
        : "";

      const parsedPlays = plays !== undefined ? Number(plays) : undefined;

      const newSong = new Song({
        title,
        artist,
        cover: coverPath,
        url: songPath,
        premium: premium === "true",
        ...(albumId ? { album: albumId } : {}),
        ...(Number.isFinite(parsedPlays) && parsedPlays >= 0
          ? { plays: Math.floor(parsedPlays) }
          : {})
      });

      await newSong.save();
      res.status(201).json(newSong);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Lấy danh sách bài hát (populate album)
router.get("/", async (req, res) => {
  try {
    const songs = await Song.find().populate("album");
    res.json(songs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tăng lượt nghe cho bài hát
router.post("/:id/play", async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Song.findByIdAndUpdate(
      id,
      { $inc: { plays: 1 } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Song not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cập nhật (set) số lượt nghe thủ công
router.patch("/:id/plays", async (req, res) => {
  try {
    const { id } = req.params;
    const { plays } = req.body;
    if (plays === undefined) {
      return res.status(400).json({ error: "Missing 'plays' in body" });
    }
    const parsed = Number(plays);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return res.status(400).json({ error: "'plays' must be a non-negative number" });
    }
    const updated = await Song.findByIdAndUpdate(
      id,
      { $set: { plays: Math.floor(parsed) } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Song not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
