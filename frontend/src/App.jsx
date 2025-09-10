import { useEffect, useState, useRef } from "react";
import "./App.css";
import {
  FaPlay,
  FaPause,
  FaStepForward,
  FaStepBackward,
  FaRedo,
  FaRandom,
  FaVolumeUp,
  FaSyncAlt,
} from "react-icons/fa";

function App() {
  const [songs, setSongs] = useState([]);
  const [albums, setAlbums] = useState([]);
  const withMediaBase = (p) => (p && p.startsWith("/uploads") ? `http://localhost:5000${p}` : p);
  const [currentIdx, setCurrentIdx] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const [volume, setVolume] = useState(1);
  const [repeat, setRepeat] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [displayedSongs, setDisplayedSongs] = useState([]); // 7 bài hát hiển thị

  useEffect(() => {
    Promise.all([
      fetch("http://localhost:5000/api/songs").then((r) => r.json()),
      fetch("http://localhost:5000/api/albums").then((r) => r.json()),
    ]).then(([songsData, albumsData]) => {
      setSongs(songsData);
      setAlbums(albumsData);
      setDisplayedSongs(getRandomSongs(songsData, 7));
    });
  }, []);

  // Hàm lấy 7 bài hát ngẫu nhiên
  const getRandomSongs = (allSongs, count) => {
    if (allSongs.length <= count) return allSongs;
    const shuffled = [...allSongs].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  // Hàm làm mới danh sách gợi ý
  const refreshRecommendations = () => {
    setDisplayedSongs(getRandomSongs(songs, 7));
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const updateProgress = () => {
      setProgress(audio.currentTime);
    };
    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("loadedmetadata", () =>
      setDuration(audio.duration || 0)
    );
    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
    };
  }, [currentIdx]);

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play();
    } else if (audioRef.current) {
      audioRef.current.pause();
    }
  }, [isPlaying, currentIdx]);

  const playSong = (idx) => {
    setCurrentIdx(idx);
    setIsPlaying(true);
  };

  const handlePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };

  const handlePrev = () => {
    if (songs.length === 0) return;
    if (shuffle) {
      let nextIdx = Math.floor(Math.random() * songs.length);
      while (songs.length > 1 && nextIdx === currentIdx) {
        nextIdx = Math.floor(Math.random() * songs.length);
      }
      setCurrentIdx(nextIdx);
    } else {
      setCurrentIdx((prev) =>
        prev === 0 || prev === null ? songs.length - 1 : prev - 1
      );
    }
    setIsPlaying(true);
  };

  const handleNext = () => {
    if (songs.length === 0) return;
    if (shuffle) {
      let nextIdx = Math.floor(Math.random() * songs.length);
      while (songs.length > 1 && nextIdx === currentIdx) {
        nextIdx = Math.floor(Math.random() * songs.length);
      }
      setCurrentIdx(nextIdx);
    } else {
      setCurrentIdx((prev) =>
        prev === null || prev === songs.length - 1 ? 0 : prev + 1
      );
    }
    setIsPlaying(true);
  };

  const handleEnded = () => {
    if (repeat) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else {
      handleNext();
    }
  };

  const current = currentIdx !== null ? songs[currentIdx] : null;

  // Định dạng thời gian mm:ss
  const formatTime = (sec) => {
    if (isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Định dạng số lượt nghe: 1K, 1M, 1B (giữ 1 số thập phân khi cần)
  const formatPlayCount = (num) => {
    if (num == null) return "0";
    const abs = Math.abs(num);
    const compact = (value) => {
      const fixed = value.toFixed(1);
      return fixed.endsWith(".0") ? String(Math.round(value)) : fixed;
    };
    if (abs >= 1_000_000_000) return `${compact(num / 1_000_000_000)}B`;
    if (abs >= 1_000_000) return `${compact(num / 1_000_000)}M`;
    if (abs >= 1_000) return `${compact(num / 1_000)}K`;
    return String(num);
  };

  // Chuỗi đầy đủ khi hover (theo locale vi-VN)
  const formatFullPlayCount = (num) => {
    if (num == null) return "0";
    const parsed = Number(num);
    return Number.isFinite(parsed) ? parsed.toLocaleString("vi-VN") : String(num);
  };

  // Tăng lượt nghe khi chọn sang bài hát mới
  useEffect(() => {
    if (currentIdx === null) return;
    const id = songs[currentIdx]?._id;
    if (!id) return;
    fetch(`http://localhost:5000/api/songs/${id}/play`, { method: "POST" })
      .then((res) => res.json())
      .then((updated) => {
        setSongs((prev) =>
          prev.map((s, i) =>
            i === currentIdx ? { ...s, plays: updated.plays ?? (s.plays || 0) + 1 } : s
          )
        );
      })
      .catch(() => {
        setSongs((prev) =>
          prev.map((s, i) => (i === currentIdx ? { ...s, plays: (s.plays || 0) + 1 } : s))
        );
      });
  }, [currentIdx]);

  return (
    <div className="music-app dark-theme">
      <header className="header">
        <div className="header-logo-block">
          <span className="logo-gradient">CoreSound</span>
          
        </div>
      </header>
      <main className="main-content">
        <section className="recommend-section recommend-section-horizontal">
          <div className="recommend-header">
            <div className="recommend-title">Gợi Ý Bài Hát</div>
            <button
              className="refresh-btn"
              onClick={refreshRecommendations}
              title="Làm mới gợi ý"
            >
              ↻
            </button>
          </div>
          <div className="recommend-horizontal-list">
            {displayedSongs.map((song, idx) => (
              <div
                key={song._id}
                className={`recommend-horizontal-card${
                  currentIdx !== null && songs[currentIdx]?._id === song._id ? " active" : ""
                }`}
              >
                <img
                  className="recommend-horizontal-art"
                  src={withMediaBase(song.cover) || "/default-cover.png"}
                  alt={song.title}
                />
                <div className="recommend-horizontal-info">
                  <div className="recommend-horizontal-title">
                    {song.title}
                    {song.premium && (
                      <span className="premium-badge">PREMIUM</span>
                    )}
                  </div>
                  <div className="recommend-horizontal-artist">
                    {song.artist}
                  </div>
                </div>
                {song.album?.name && (
                  <span className="recommend-horizontal-album" title={song.album.name}>
                    {song.album.name}
                  </span>
                )}
                <span
                  className="recommend-horizontal-plays"
                  title={formatFullPlayCount(song.plays)}
                >
                  {formatPlayCount(song.plays)}
                </span>
                <button
                  className="recommend-horizontal-play"
                  onClick={() => {
                    const realIdx = songs.findIndex((s) => s._id === song._id);
                    if (realIdx === -1) return;
                    const isCurrent = currentIdx !== null && songs[currentIdx]?._id === song._id;
                    if (isCurrent) {
                      setIsPlaying((prev) => !prev); // toggle play/pause khi click lại đúng bài đang phát
                    } else {
                      playSong(realIdx); // chuyển sang bài được click và phát luôn
                    }
                  }}
                >
                  {currentIdx !== null && songs[currentIdx]?._id === song._id && isPlaying ? <FaPause /> : <FaPlay />}
                </button>
              </div>
            ))}
          </div>
        </section>
        <section className="recommend-section recommend-section-horizontal">
          <div className="recommend-header">
            <div className="recommend-title">Album Mới</div>
          </div>
          <div className="recommend-horizontal-list album-list">
            {albums.map((al) => (
              <div key={al._id} className="recommend-horizontal-card">
                <img
                  className="recommend-horizontal-art"
                  src={withMediaBase(al.cover) || "/default-cover.png"}
                  alt={al.name}
                />
                <div className="recommend-horizontal-info">
                  <div className="recommend-horizontal-title">{al.name}</div>
                  <div className="recommend-horizontal-artist">{al.artist}</div>
                </div>
                {typeof al.plays === "number" && (
                  <span className="recommend-horizontal-plays" title={formatFullPlayCount(al.plays)}>
                    {formatPlayCount(al.plays)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
        {/* Các thành phần khác sẽ thêm vào đây sau này */}
      </main>
      {current && (
        <div className="music-bar spotify-bar">
          <div className="spotify-bar-left">
            <img
              className="spotify-album-art"
              src={withMediaBase(current.cover) || "/default-cover.png"}
              alt="Album Art"
            />
            <div className="spotify-song-info">
              <span className="spotify-song-title">{current.title}</span>
              <span className="spotify-song-artist">{current.artist}</span>
            </div>
          </div>
          <div className="spotify-bar-center">
            <div className="spotify-controls">
              <button
                className={`spotify-btn shuffle${shuffle ? " active" : ""}`}
                onClick={() => setShuffle((s) => !s)}
                title="Shuffle"
              >
                <FaRandom />
              </button>
              <button className="spotify-btn prev" onClick={handlePrev}>
                <FaStepBackward />
              </button>
              <button
                className="spotify-btn playpause"
                onClick={handlePlayPause}
              >
                {isPlaying ? <FaPause /> : <FaPlay />}
              </button>
              <button className="spotify-btn next" onClick={handleNext}>
                <FaStepForward />
              </button>
              <button
                className={`spotify-btn repeat${repeat ? " active" : ""}`}
                onClick={() => setRepeat((r) => !r)}
                title="Repeat"
              >
                <FaRedo />
              </button>
            </div>
            <div className="spotify-progress-row">
              <span className="spotify-time-label">{formatTime(progress)}</span>
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={progress}
                onChange={(e) => {
                  setProgress(Number(e.target.value));
                  if (audioRef.current)
                    audioRef.current.currentTime = Number(e.target.value);
                }}
                className="spotify-progress-slider"
                title="Tiến trình"
              />
              <span className="spotify-time-label">{formatTime(duration)}</span>
            </div>
          </div>
          <div className="spotify-bar-right">
            <span className="spotify-volume-icon">
              <FaVolumeUp />
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="spotify-volume-slider"
              title="Âm lượng"
            />
          </div>
          <audio
            ref={audioRef}
            src={current.url}
            autoPlay={isPlaying}
            onEnded={handleEnded}
          />
        </div>
      )}
    </div>
  );
}

export default App;
