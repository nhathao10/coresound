import { useEffect, useState } from "react";
import "./App.css";
import { FaPlay, FaPause } from "react-icons/fa";
import { usePlayer } from "./PlayerContext.jsx";

function App() {
  const [songs, setSongs] = useState([]);
  const [albums, setAlbums] = useState([]);
  const withMediaBase = (p) => (p && p.startsWith("/uploads") ? `http://localhost:5000${p}` : p);
  const { setQueueAndPlay, currentIdx, isPlaying, setIsPlaying, queue, setCurrentIdx } = usePlayer();
  const [displayedSongs, setDisplayedSongs] = useState([]); // 7 bài hát hiển thị
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

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

  const playSong = (idx) => {
    // ensure the global queue contains the full songs list in the same order
    const queueMismatch = !queue || queue.length !== songs.length || songs.some((s, i) => queue[i]?._id !== s._id);
    if (queueMismatch) {
      setQueueAndPlay(songs, idx);
    } else {
      setCurrentIdx(idx);
      setIsPlaying(true);
    }
  };

  const current = currentIdx !== null ? songs[currentIdx] : null;

  // Định dạng thời gian mm:ss
  // local formatting helpers removed; global player renders UI

  // Chuẩn hóa chuỗi để tìm kiếm không phân biệt dấu, hoa/thường
  const normalize = (str) => {
    return (str || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  // Cập nhật kết quả tìm kiếm theo searchQuery
  useEffect(() => {
    const q = normalize(searchQuery.trim());
    if (!q) {
      setSearchResults([]);
      return;
    }
    const results = songs.filter((s) => {
      const inTitle = normalize(s.title).includes(q);
      const inArtist = normalize(s.artist).includes(q);
      return inTitle || inArtist;
    });
    setSearchResults(results);
  }, [searchQuery, songs]);

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
          <input
            type="text"
            placeholder="Tìm kiếm bài hát hoặc nghệ sĩ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            style={{
              marginLeft: 16,
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #444",
              background: "#1f1f1f",
              color: "#fff",
              minWidth: 360,
            }}
          />
        </div>
      </header>
      <main className="main-content">
        {searchQuery.trim() && (
          <section className="recommend-section recommend-section-horizontal">
            <div className="recommend-header">
              <div className="recommend-title">
                Kết Quả Tìm Kiếm
              </div>
              <div style={{ opacity: 0.8, fontSize: 14 }}>
                {searchResults.length} kết quả
              </div>
            </div>
            <div className="recommend-horizontal-list">
              {searchResults.map((song) => (
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
                    <div className="recommend-horizontal-title">{song.title}</div>
                    <div className="recommend-horizontal-artist">{song.artist}</div>
                  </div>
                  {song.album?.name && (
                    <span className="recommend-horizontal-album" title={song.album.name}>
                      {song.album.name}
                    </span>
                  )}
                  <button
                    className="recommend-horizontal-play"
                    onClick={() => {
                      const realIdx = songs.findIndex((s) => s._id === song._id);
                      if (realIdx === -1) return;
                      const isCurrent = currentIdx !== null && songs[currentIdx]?._id === song._id;
                      if (isCurrent) {
                        setIsPlaying((prev) => !prev);
                      } else {
                        playSong(realIdx);
                      }
                    }}
                  >
                    {currentIdx !== null && songs[currentIdx]?._id === song._id && isPlaying ? <FaPause /> : <FaPlay />}
                  </button>
                </div>
              ))}
              {searchResults.length === 0 && (
                <div style={{ padding: 12, opacity: 0.8 }}>Không tìm thấy kết quả phù hợp.</div>
              )}
            </div>
          </section>
        )}
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
              <a key={al._id} href={`#/album/${encodeURIComponent(al._id)}`} className="recommend-horizontal-card" style={{ textDecoration: "none", color: "inherit" }}>
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
              </a>
            ))}
          </div>
        </section>
        {/* Các thành phần khác sẽ thêm vào đây sau này */}
      </main>
      {/* GlobalPlayer renders persistently in main.jsx */}
    </div>
  );
}

export default App;
