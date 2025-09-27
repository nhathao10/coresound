const express = require("express");
const multer = require("multer");
const path = require("path");
const Song = require("../models/Song");

const router = express.Router();

// Single multer with dynamic destination for cover/song
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "cover") {
      cb(null, path.join(__dirname, "../uploads/covers"));
    } else if (file.fieldname === "song") {
      cb(null, path.join(__dirname, "../uploads/songs"));
    } else {
      cb(null, path.join(__dirname, "../uploads"));
    }
  },
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Thêm bài hát mới (upload cả cover và mp3)
router.post(
  "/add",
  upload.fields([
    { name: "cover", maxCount: 1 },
    { name: "song", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { title, artist, premium, plays, albumId, genreId, regionId } = req.body;
      if (!title || !artist) {
        return res.status(400).json({ error: "Missing required fields: title, artist" });
      }

      const coverFile = req.files && req.files.cover && req.files.cover[0];
      const songFile = req.files && req.files.song && req.files.song[0];
      if (!coverFile || !songFile) {
        return res.status(400).json({ error: "Both cover and song files are required" });
      }

      const coverPath = `/uploads/covers/${coverFile.filename}`;
      const songPath = `/uploads/songs/${songFile.filename}`;

      const parsedPlays = plays !== undefined ? Number(plays) : undefined;

      const newSong = new Song({
        title,
        artist,
        cover: coverPath,
        url: songPath,
        premium: String(premium) === "true",
        ...(albumId ? { album: albumId } : {}),
        ...(genreId ? { genre: genreId } : {}),
        ...(regionId ? { region: regionId } : {}),
        ...(Number.isFinite(parsedPlays) && parsedPlays >= 0
          ? { plays: Math.floor(parsedPlays) }
          : {}),
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
    const songs = await Song.find().populate("album").populate("genre").populate("region");
    res.json(songs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cập nhật file cover/song cho bài hát cụ thể
router.patch(
  "/:id/files",
  upload.fields([
    { name: "cover", maxCount: 1 },
    { name: "song", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const update = {};
      if (req.files && req.files.cover && req.files.cover[0]) {
        update.cover = `/uploads/covers/${req.files.cover[0].filename}`;
      }
      if (req.files && req.files.song && req.files.song[0]) {
        update.url = `/uploads/songs/${req.files.song[0].filename}`;
      }
      if (Object.keys(update).length === 0) {
        return res.status(400).json({ error: "No files provided" });
      }
      const updated = await Song.findByIdAndUpdate(id, { $set: update }, { new: true });
      if (!updated) return res.status(404).json({ error: "Song not found" });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Cập nhật thông tin bài hát (không bao gồm upload file)
router.put("/:id", async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: "Request body is required" });
    }
    const { id } = req.params;
    const update = {};
    const allowed = ["title", "artist", "plays", "premium", "album", "genre", "region", "url", "cover"];
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    const updated = await Song.findByIdAndUpdate(id, { $set: update }, { new: true });
    if (!updated) return res.status(404).json({ error: "Song not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Xoá bài hát
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Song.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "Song not found" });
    res.json({ success: true });
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
