const express = require("express");
const Region = require("../models/Region");
const Song = require("../models/Song");
const Album = require("../models/Album");
const multer = require("multer");
const path = require("path");

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/regions/"));
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

// GET /api/regions → lấy tất cả regions
router.get("/", async (req, res) => {
  try {
    const regions = await Region.find().sort({ name: 1 });
    res.json(regions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/regions → thêm khu vực mới (với file upload)
router.post("/", upload.fields([
  { name: "cover", maxCount: 1 },
  { name: "flag", maxCount: 1 }
]), async (req, res) => {
  try {
    
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: "Request body is not properly formatted" });
    }
    
    const { name, slug, description } = req.body;
    if (!name) return res.status(400).json({ error: "'name' is required" });

    const regionData = { name, slug, description };
    
    // Xử lý file upload
    if (req.files) {
      if (req.files.cover && req.files.cover[0]) {
        regionData.cover = `/uploads/regions/${req.files.cover[0].filename}`;
      }
      if (req.files.flag && req.files.flag[0]) {
        regionData.flag = `/uploads/regions/${req.files.flag[0].filename}`;
      }
    }

    const region = new Region(regionData);
    await region.save();
    res.status(201).json(region);
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ error: "Region name already exists" });
    }
    res.status(500).json({ error: err.message });
  }
});

// GET /api/regions/:id → lấy khu vực theo ID
router.get("/:id", async (req, res) => {
  try {
    const region = await Region.findById(req.params.id);
    if (!region) return res.status(404).json({ error: "Region not found" });
    res.json(region);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/regions/:id → cập nhật khu vực
router.put("/:id", async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: "Request body is required" });
    }
    
    const { id } = req.params;
    const update = {};
    const allowed = ["name", "slug", "description", "cover", "flag"];
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    
    const updated = await Region.findByIdAndUpdate(id, { $set: update }, { new: true });
    if (!updated) return res.status(404).json({ error: "Region not found" });
    res.json(updated);
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ error: "Region name already exists" });
    }
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/regions/:id/cover → cập nhật ảnh bìa
router.patch("/:id/cover", upload.single("cover"), async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) {
      return res.status(400).json({ error: "Cover file is required" });
    }
    
    const coverPath = `/uploads/regions/${req.file.filename}`;
    const updated = await Region.findByIdAndUpdate(
      id, 
      { $set: { cover: coverPath } }, 
      { new: true }
    );
    
    if (!updated) return res.status(404).json({ error: "Region not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/regions/:id/flag → cập nhật ảnh cờ
router.patch("/:id/flag", upload.single("flag"), async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) {
      return res.status(400).json({ error: "Flag file is required" });
    }
    
    const flagPath = `/uploads/regions/${req.file.filename}`;
    const updated = await Region.findByIdAndUpdate(
      id, 
      { $set: { flag: flagPath } }, 
      { new: true }
    );
    
    if (!updated) return res.status(404).json({ error: "Region not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/regions/:id → xóa khu vực
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Kiểm tra xem có bài hát nào đang sử dụng khu vực này không
    const songsUsingRegion = await Song.countDocuments({ region: id });
    if (songsUsingRegion > 0) {
      return res.status(409).json({ 
        error: `Cannot delete region. ${songsUsingRegion} song(s) are using this region.` 
      });
    }
    
    const deleted = await Region.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "Region not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
