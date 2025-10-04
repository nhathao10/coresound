import { useEffect, useMemo, useRef, useState } from "react";
import {
  FaPlay,
  FaPause,
  FaStepForward,
  FaStepBackward,
  FaRedo,
  FaRandom,
  FaVolumeUp,
} from "react-icons/fa";
import { usePlayer } from "./PlayerContext.jsx";
import Header from "./Header.jsx";

function AlbumDetail() {
  const [album, setAlbum] = useState(null);
  const [allSongs, setAllSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalDuration, setTotalDuration] = useState(0);

  const withMediaBase = (p) => (p && p.startsWith("/uploads") ? `http://localhost:5000${p}` : p);

  // Read album id from hash: #/album/<id>
  const albumId = useMemo(() => {
    const hash = window.location.hash || "#/";
    const match = hash.match(/^#\/album\/([^/?#]+)/);
    return match ? decodeURIComponent(match[1]) : "";
  }, []);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setError("");
    Promise.all([
      fetch(`http://localhost:5000/api/albums/${albumId}`).then((r) => r.json()),
      fetch("http://localhost:5000/api/songs").then((r) => r.json()),
    ])
      .then(([albumData, songsData]) => {
        if (!mounted) return;
        if (albumData?.error) throw new Error(albumData.error);
        setAlbum(albumData);
        setAllSongs(songsData || []);
        document.title = `${albumData.name} • CoreSound`;
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e.message || String(e));
      })
      .finally(() => mounted && setIsLoading(false));
    return () => {
      mounted = false;
    };
  }, [albumId]);

  const songs = useMemo(() => {
    const id = String(album?._id || albumId);
    return allSongs.filter((s) => {
      const a = s.album;
      if (!a) return false;
      const aid = typeof a === "string" ? a : a._id;
      return String(aid) === id;
    });
  }, [allSongs, album, albumId]);

  // Preload durations for all songs in this album to compute total duration
  useEffect(() => {
    if (!songs || songs.length === 0) {
      setTotalDuration(0);
      return;
    }
    let isCancelled = false;
    let loadedCount = 0;
    let sum = 0;
    const audios = songs.map((s) => {
      const a = new Audio(withMediaBase(s.url));
      const onMeta = () => {
        loadedCount += 1;
        if (!isNaN(a.duration)) sum += a.duration;
        if (!isCancelled && loadedCount === songs.length) setTotalDuration(sum);
      };
      const onError = () => {
        loadedCount += 1;
        if (!isCancelled && loadedCount === songs.length) setTotalDuration(sum);
      };
      a.addEventListener("loadedmetadata", onMeta);
      a.addEventListener("error", onError);
      // trigger load
      a.preload = "metadata";
      a.load();
      return { a, onMeta, onError };
    });
    return () => {
      isCancelled = true;
      audios.forEach(({ a, onMeta, onError }) => {
        a.removeEventListener("loadedmetadata", onMeta);
        a.removeEventListener("error", onError);
        try { a.src = ""; } catch {}
      });
    };
  }, [songs]);

  // Player state for album songs only
  const {
    queue,
    currentIdx,
    isPlaying,
    shuffle,
    repeat,
    progress,
    duration,
    volume,
    setIsPlaying,
    setShuffle,
    setRepeat,
    setProgress,
    setDuration,
    setVolume,
    setCurrentIdx,
    setQueueAndPlay,
    setQueueContext,
  } = usePlayer();
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setProgress(audio.currentTime);
    const onMeta = () => setDuration(audio.duration || 0);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
    };
  }, [currentIdx]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.play(); else audioRef.current.pause();
  }, [isPlaying, currentIdx]);

  const current = currentIdx !== null ? songs[currentIdx] : null;

  const playAt = (idx) => {
    // set global queue to this album's songs and play
    if (!queue || queue.length !== songs.length || songs.some((s, i) => queue[i]?._id !== s._id)) {
      setQueueAndPlay(songs, idx);
    } else {
      setCurrentIdx(idx);
      setIsPlaying(true);
    }
    // Set context to "album" when playing from album
    setQueueContext("album");
  };
  const togglePlayPause = () => setIsPlaying((p) => !p);
  const next = () => {
    if (songs.length === 0) return;
    if (shuffle) {
      let n = Math.floor(Math.random() * songs.length);
      while (songs.length > 1 && n === currentIdx) n = Math.floor(Math.random() * songs.length);
      setCurrentIdx(n);
    } else {
      setCurrentIdx((i) => (i === null || i === songs.length - 1 ? 0 : i + 1));
    }
    setIsPlaying(true);
  };
  const prev = () => {
    if (songs.length === 0) return;
    if (shuffle) {
      let n = Math.floor(Math.random() * songs.length);
      while (songs.length > 1 && n === currentIdx) n = Math.floor(Math.random() * songs.length);
      setCurrentIdx(n);
    } else {
      setCurrentIdx((i) => (i === 0 || i === null ? songs.length - 1 : i - 1));
    }
    setIsPlaying(true);
  };
  const onEnded = () => {
    if (repeat && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else {
      next();
    }
  };

  const formatTime = (sec) => {
    if (isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const formatTotalDuration = (sec) => {
    if (!sec || isNaN(sec)) return "0 phút";
    const total = Math.floor(sec);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) return `${h} giờ ${m.toString().padStart(2, "0")} phút`;
    if (m > 0) return `${m} phút ${s.toString().padStart(2, "0")} giây`;
    return `${s} giây`;
  };

  if (isLoading) return <div className="music-app dark-theme" style={{ padding: 24 }}>Đang tải...</div>;
  if (error) return <div className="music-app dark-theme" style={{ padding: 24, color: "#ff8080" }}>{error}</div>;
  if (!album) return <div className="music-app dark-theme" style={{ padding: 24 }}>Không tìm thấy album</div>;

  return (
    <div className="music-app dark-theme" style={{ width: "100%", flex: 1, minWidth: 0, alignSelf: "stretch" }}>
      <Header showSearch={true} showSearchResults={false} />
      <main className="main-content" style={{ padding: "9rem 2rem 140px", width: "100%", flex: 1, minWidth: 0 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <section className="recommend-section" style={{ width: "100%", padding: 20, background: "linear-gradient(180deg, #0f2a3a 0%, #15161a 70%)", borderRadius: 12 }}>
          <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 12 }}>
            <img src={withMediaBase(album.cover) || "/default-cover.png"} alt={album.name} style={{ width: 200, height: 200, borderRadius: 12, objectFit: "cover", boxShadow: "0 10px 30px rgba(0,0,0,0.4)" }} />
            <div>
              <div style={{ color: "#89b4fa", textTransform: "uppercase", letterSpacing: 1, fontSize: 14, marginBottom: 6 }}>Album</div>
              <div className="logo-gradient" style={{ fontSize: 64, lineHeight: 1, marginBottom: 10 }}>{album.name}</div>
              <div style={{ color: "#cfd3da", marginBottom: 14, fontSize: 16 }}>
                {album.artist} • {songs.length} bài • {formatTotalDuration(totalDuration)}
              </div>
              {album.genres && album.genres.length > 0 && (
                <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ color: "#89b4fa", fontSize: 14 }}>Thể loại</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {album.genres.map((genre, index) => (
                      <span
                        key={index}
                        style={{
                          background: "rgba(137, 180, 250, 0.1)",
                          color: "#89b4fa",
                          padding: "4px 12px",
                          borderRadius: "16px",
                          fontSize: "12px",
                          border: "1px solid rgba(137, 180, 250, 0.2)"
                        }}
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ display: "flex", gap: 10 }}>
                <button className="spotify-btn playpause" onClick={() => songs.length && playAt(0)} title="Phát album" style={{ transform: "scale(1.2)" }}>
                  <FaPlay />
                </button>
                <button className={`spotify-btn shuffle${shuffle ? " active" : ""}`} onClick={() => setShuffle((s) => !s)} title="Shuffle">
                  <FaRandom />
                </button>
              </div>
            </div>
          </div>

          <div style={{ border: "1px solid #2e2e37", borderRadius: 12, overflow: "hidden", background: "#1b1c22" }}>
            <div style={{ display: "grid", gridTemplateColumns: "48px 1fr 140px 80px", padding: "10px 16px", background: "#20212a", color: "#b3b3b3", fontSize: 14 }}>
              <div style={{ textAlign: "right", paddingRight: 12 }}>#</div>
              <div>Tiêu đề</div>
              <div>Nghệ sĩ</div>
              <div style={{ textAlign: "center" }}>Phát</div>
            </div>

            {songs.map((s, idx) => {
              const isCurrent = currentIdx !== null && songs[currentIdx]?._id === s._id;
              return (
                <div
                  key={s._id}
                  onClick={() => (isCurrent ? setIsPlaying((p) => !p) : playAt(idx))}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "48px 1fr 140px 80px",
                    padding: "10px 16px",
                    alignItems: "center",
                    cursor: "pointer",
                    background: isCurrent ? "#252733" : "transparent",
                    borderTop: "1px solid #262833",
                  }}
                >
                  <div style={{ textAlign: "right", paddingRight: 12, color: "#b3b3b3" }}>{idx + 1}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <img src={withMediaBase(s.cover) || "/default-cover.png"} alt={s.title} style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover" }} />
                    <div>
                      <div style={{ fontWeight: 600 }}>{s.title}</div>
                      <div style={{ color: "#9aa0a6", fontSize: 13 }}>{album.artist}</div>
                    </div>
                  </div>
                  <div style={{ color: "#cfd3da" }}>{s.artist}</div>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <button
                      className="spotify-btn playpause"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isCurrent) setIsPlaying((p) => !p); else playAt(idx);
                      }}
                      title={isCurrent && isPlaying ? "Tạm dừng" : "Phát"}
                    >
                      {isCurrent && isPlaying ? <FaPause /> : <FaPlay />}
                    </button>
                  </div>
                </div>
              );
            })}
            {songs.length === 0 && <div style={{ padding: 12, opacity: 0.8 }}>Album chưa có bài hát.</div>}
          </div>
        </section>
        </div>
      </main>

      {/* GlobalPlayer is persistent; remove local bar */}
    </div>
  );
}

export default AlbumDetail;


