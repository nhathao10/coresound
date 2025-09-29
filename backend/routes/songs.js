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
      const { title, artist, premium, plays, albumId, genres, regionId } = req.body;
      
      // Xử lý genres từ FormData (JSON string)
      let parsedGenres = [];
      if (genres) {
        try {
          parsedGenres = JSON.parse(genres);
        } catch (e) {
          parsedGenres = [];
        }
      }
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
        ...(parsedGenres && parsedGenres.length > 0 ? { genres: parsedGenres } : {}),
        ...(regionId ? { region: regionId } : {}),
        ...(Number.isFinite(parsedPlays) && parsedPlays >= 0
          ? { plays: Math.floor(parsedPlays) }
          : {}),
      });

      await newSong.save();
      const populatedSong = await Song.findById(newSong._id)
        .populate("album")
        .populate("genres")
        .populate("region");
      res.status(201).json(populatedSong);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Lấy danh sách bài hát (populate album)
router.get("/", async (req, res) => {
  try {
    const songs = await Song.find().populate("album").populate("genres").populate("region");
    res.json(songs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lấy thông tin một bài hát cụ thể
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const song = await Song.findById(id)
      .populate("album")
      .populate("genres")
      .populate("region");
    if (!song) return res.status(404).json({ error: "Song not found" });
    res.json(song);
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
      const updated = await Song.findByIdAndUpdate(id, { $set: update }, { new: true })
        .populate("album")
        .populate("genres")
        .populate("region");
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
    const allowed = ["title", "artist", "plays", "premium", "album", "genres", "region", "url", "cover"];
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    
    // Xử lý genres
    if (req.body.genres !== undefined) {
      if (Array.isArray(req.body.genres)) {
        // Nếu là array trực tiếp (từ JSON request)
        update.genres = req.body.genres;
      } else if (typeof req.body.genres === 'string') {
        // Nếu là JSON string (từ FormData)
        try {
          const parsedGenres = JSON.parse(req.body.genres);
          update.genres = Array.isArray(parsedGenres) ? parsedGenres : [];
        } catch (e) {
          update.genres = [];
        }
      } else {
        update.genres = [];
      }
    }
    const updated = await Song.findByIdAndUpdate(id, { $set: update }, { new: true })
      .populate("album")
      .populate("genres")
      .populate("region");
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
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const updated = await Song.findByIdAndUpdate(
      id,
      { 
        $inc: { 
          plays: 1,
          weeklyPlays: 1
        },
        $set: { lastPlayed: now }
      },
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

// Lấy trending songs theo khu vực
router.get("/trending/:region", async (req, res) => {
  try {
    const { region } = req.params;
    const { limit = 5 } = req.query;
    
    // Map region names to region IDs or search patterns
    let regionFilter = {};
    if (region === "vietnam" || region === "viet-nam") {
      regionFilter = { 
        $or: [
          { "region.name": { $regex: /việt nam|vietnam/i } },
          { "region.name": { $regex: /viet nam/i } }
        ]
      };
    } else if (region === "us-uk" || region === "usuk") {
      regionFilter = { 
        $or: [
          { "region.name": { $regex: /us-uk|usuk|mỹ|anh|america|britain/i } },
          { "region.name": { $regex: /âu mỹ|au my/i } }
        ]
      };
    } else if (region === "korea" || region === "k-pop" || region === "kpop") {
      regionFilter = { 
        $or: [
          { "region.name": { $regex: /hàn quốc|korea|k-pop|kpop/i } },
          { "region.name": { $regex: /han quoc/i } }
        ]
      };
    }
    
    const songs = await Song.find(regionFilter)
      .populate("album")
      .populate("genres")
      .populate("region")
      .sort({ weeklyPlays: -1, plays: -1, createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json(songs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset weekly plays (chạy mỗi tuần)
router.post("/reset-weekly-plays", async (req, res) => {
  try {
    const result = await Song.updateMany(
      {},
      { $set: { weeklyPlays: 0 } }
    );
    res.json({ 
      message: "Weekly plays reset successfully", 
      modifiedCount: result.modifiedCount 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cập nhật weeklyPlays cho tất cả bài hát (migration)
router.post("/update-weekly-plays", async (req, res) => {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    // Reset tất cả weeklyPlays về 0
    await Song.updateMany({}, { $set: { weeklyPlays: 0 } });
    
    // Có thể thêm logic phức tạp hơn ở đây nếu cần
    // Ví dụ: tính weeklyPlays dựa trên lastPlayed
    
    res.json({ message: "Weekly plays updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
