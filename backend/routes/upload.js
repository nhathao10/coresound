const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// Storage động cho cover và song
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "cover") {
      cb(null, path.join(__dirname, "../uploads/covers"));
    } else if (file.fieldname === "song") {
      cb(null, path.join(__dirname, "../uploads/songs"));
    } else {
      cb(null, path.join(__dirname, "../uploads"));
    }
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

// Upload 1 file ảnh cover
router.post("/upload-cover", upload.single("cover"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const fileUrl = `/uploads/covers/${req.file.filename}`;
  res.json({
    message: "Upload cover thành công",
    fileUrl
  });
});

// Upload 1 file mp3
router.post("/upload-song", upload.single("song"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const fileUrl = `/uploads/songs/${req.file.filename}`;
  res.json({
    message: "Upload song thành công",
    fileUrl
  });
});

module.exports = router;
