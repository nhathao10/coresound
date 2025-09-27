import { useEffect, useRef, useState } from "react";
import "./App.css";
import { FaPlay, FaPause } from "react-icons/fa";
import { usePlayer } from "./PlayerContext.jsx";

function App() {
  const [songs, setSongs] = useState([]);
  const [albums, setAlbums] = useState([]);
  const withMediaBase = (p) => (p && p.startsWith("/uploads") ? `http://localhost:5000${p}` : p);
  const { setQueueAndPlay, currentIdx, isPlaying, setIsPlaying, queue, setCurrentIdx, current } = usePlayer();
  const [displayedSongs, setDisplayedSongs] = useState([]); // 7 bài hát hiển thị
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [recentSongs, setRecentSongs] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchWrapRef = useRef(null);

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

  // Load recent songs history
  useEffect(() => {
    try {
      const raw = localStorage.getItem("cs_recent_songs");
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setRecentSongs(arr);
      }
    } catch {}
  }, []);

  const saveRecentSong = (song) => {
    if (!song || !song._id) return;
    const item = { _id: song._id, title: song.title, artist: song.artist, cover: song.cover };
    setRecentSongs((prev) => {
      const deduped = prev.filter((s) => s._id !== item._id);
      const next = [item, ...deduped].slice(0, 8);
      try { localStorage.setItem("cs_recent_songs", JSON.stringify(next)); } catch {}
      return next;
    });
  };
  const removeRecentSong = (id) => {
    setRecentSongs((prev) => {
      const next = prev.filter((s) => s._id !== id);
      try { localStorage.setItem("cs_recent_songs", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  // Hide dropdown when clicking outside
  useEffect(() => {
    const onDoc = (e) => {
      if (!searchWrapRef.current) return;
      if (!searchWrapRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
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
    if (!current) return;
    const id = current._id;
    if (!id) return;
    fetch(`http://localhost:5000/api/songs/${id}/play`, { method: "POST" })
      .then((res) => res.json())
      .then((updated) => {
        setSongs((prev) =>
          prev.map((s) =>
            s._id === id ? { ...s, plays: updated.plays ?? (s.plays || 0) + 1 } : s
          )
        );
      })
      .catch(() => {
        setSongs((prev) =>
          prev.map((s) => (s._id === id ? { ...s, plays: (s.plays || 0) + 1 } : s))
        );
      });
  }, [current]);

  // Cập nhật tiêu đề tab khi có bài hát đang phát
  useEffect(() => {
    if (current && isPlaying) {
      document.title = `♪ ${current.title} - ${current.artist} | CoreSound`;
    } else {
      document.title = "CoreSound - Music Player";
    }
  }, [current, isPlaying]);

  return (
    <div className="music-app dark-theme">
      <header className="header">
        <div className="header-logo-block">
          <span className="logo-gradient">CoreSound</span>
          <div ref={searchWrapRef} style={{ position: "relative", marginLeft: 16, width: 360, display: "inline-block" }}>
          <input
            type="text"
            placeholder="Tìm kiếm bài hát hoặc nghệ sĩ..."
            value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
              onKeyDown={(e) => { if (e.key === "Enter") { if (searchResults[0]) saveRecentSong(searchResults[0]); setShowDropdown(false); } }}
            className="search-input"
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #444",
              background: "#1f1f1f",
              color: "#fff",
                width: "100%",
                boxSizing: "border-box",
              }}
            />
            {showDropdown && (
            <div style={{ position: "absolute", left: 0, top: 40, width: "100%", background: "#1e1e24", border: "1px solid #2e2e37", borderRadius: 8, boxShadow: "0 6px 18px #0009", zIndex: 200, maxHeight: 360, overflowY: "auto" }}>
              {searchQuery.trim() ? (
                <div>
                  {searchResults.slice(0, 8).map((song) => (
                    <div key={song._id} onMouseDown={(e) => e.preventDefault()} onClick={() => {
                      saveRecentSong(song);
                      const realIdx = songs.findIndex((s) => s._id === song._id);
                      if (realIdx !== -1) playSong(realIdx);
                      setShowDropdown(false);
                    }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", cursor: "pointer" }}>
                      <img src={withMediaBase(song.cover) || "/default-cover.png"} alt={song.title} style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover" }} />
                      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                        <span style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.title}</span>
                        <span style={{ color: "#b3b3b3", fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.artist}</span>
                      </div>
                    </div>
                  ))}
                  {searchResults.length === 0 && (
                    <div style={{ padding: 10, color: "#b3b3b3" }}>Không có gợi ý phù hợp</div>
                  )}
                </div>
              ) : (
                <div>
                  {recentSongs.length > 0 ? (
                    recentSongs.map((song) => (
                      <div key={song._id} onMouseDown={(e) => e.preventDefault()} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px" }}>
                        <img src={withMediaBase(song.cover) || "/default-cover.png"} alt={song.title} style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover" }} />
                        <div onClick={() => { const realIdx = songs.findIndex((s) => s._id === song._id); if (realIdx !== -1) playSong(realIdx); setShowDropdown(false); }} style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1, cursor: "pointer" }}>
                          <span style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.title}</span>
                          <span style={{ color: "#b3b3b3", fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.artist}</span>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); removeRecentSong(song._id); }} title="Xóa khỏi lịch sử" style={{ background: "transparent", border: "none", color: "#b3b3b3", fontSize: 16, cursor: "pointer", padding: 4, lineHeight: 1 }}>×</button>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: 10, color: "#b3b3b3" }}>Chưa có lịch sử tìm kiếm</div>
                  )}
                </div>
              )}
            </div>
            )}
          </div>
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
            <div className="recommend-horizontal-list" style={{ gap: "1rem", gridAutoColumns: "200px" }}>
              {searchResults.map((song) => (
                <div
                  key={song._id}
                  className={`recommend-horizontal-card${
                    current && current._id === song._id ? " active" : ""
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
                      const isCurrent = current && current._id === song._id;
                      if (isCurrent) {
                        setIsPlaying((prev) => !prev);
                      } else {
                        playSong(realIdx);
                      }
                    }}
                  >
                    {current && current._id === song._id && isPlaying ? <FaPause /> : <FaPlay />}
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
                  current && current._id === song._id ? " active" : ""
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
                    const isCurrent = current && current._id === song._id;
                    if (isCurrent) {
                      setIsPlaying((prev) => !prev); // toggle play/pause khi click lại đúng bài đang phát
                    } else {
                      playSong(realIdx); // chuyển sang bài được click và phát luôn
                    }
                  }}
                >
                  {current && current._id === song._id && isPlaying ? <FaPause /> : <FaPlay />}
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
