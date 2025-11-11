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
import { useAuth } from "./AuthContext.jsx";
import Header from "./Header.jsx";

function AlbumDetail() {
  const [album, setAlbum] = useState(null);
  const [allSongs, setAllSongs] = useState([]);
  const [allAlbums, setAllAlbums] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalDuration, setTotalDuration] = useState(0);
  
  // Comments and ratings state
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [userRating, setUserRating] = useState(0);
  const [albumRating, setAlbumRating] = useState({ average: 0, count: 0, breakdown: {} });
  const [editingComments, setEditingComments] = useState({});
  const [editContents, setEditContents] = useState({});
  
  // User interaction state
  const [isAlbumFavorited, setIsAlbumFavorited] = useState(false);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [userPlaylists, setUserPlaylists] = useState([]);
  
  const { user, isAuthenticated } = useAuth();

  const withMediaBase = (p) => (p && p.startsWith("/uploads") ? `http://localhost:5000${p}` : p);

  // Load comments and ratings
  const loadCommentsAndRatings = async () => {
    if (!album?._id) return;
    
    try {
      const [commentsRes, ratingsRes] = await Promise.all([
        fetch(`http://localhost:5000/api/albums/${album._id}/comments`),
        fetch(`http://localhost:5000/api/albums/${album._id}/ratings`)
      ]);
      
      if (commentsRes.ok) {
        const commentsData = await commentsRes.json();
        setComments(commentsData.comments || commentsData);
      }
      
      if (ratingsRes.ok) {
        const ratingsData = await ratingsRes.json();
        setAlbumRating(ratingsData);
      }

      // Load user's rating if authenticated
      if (isAuthenticated && user?._id) {
        try {
          const savedUser = localStorage.getItem('cs_user');
          if (savedUser) {
            const userData = JSON.parse(savedUser);
            const token = userData.token;
            
            const userRatingRes = await fetch(`http://localhost:5000/api/albums/${album._id}/ratings/user/${user._id}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (userRatingRes.ok) {
              const userRatingData = await userRatingRes.json();
              setUserRating(userRatingData.rating || 0);
            }
          }
        } catch (error) {
          console.error('Error loading user rating:', error);
        }
      }
    } catch (error) {
      console.error('Error loading comments and ratings:', error);
    }
  };

  // Submit comment
  const handleSubmitComment = async () => {
    if (!isAuthenticated || !newComment.trim() || !album?._id) return;
    
    try {
      const savedUser = localStorage.getItem('cs_user');
      if (!savedUser) {
        console.error('No user found');
        return;
      }
      
      const userData = JSON.parse(savedUser);
      const token = userData.token;
      
      if (!token) {
        console.error('No token found in user data');
        return;
      }
      

      const response = await fetch(`http://localhost:5000/api/albums/${album._id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: newComment.trim(),
          userId: user._id,
          userName: user.name,
          userAvatar: user.avatar
        })
      });
      
      if (response.ok) {
        setNewComment("");
        loadCommentsAndRatings(); // Reload comments
      } else {
        const errorData = await response.json();
        console.error('Error submitting comment:', errorData);
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  // Submit rating
  const handleSubmitRating = async (rating) => {
    if (!isAuthenticated || !album?._id) return;
    
    try {
      const savedUser = localStorage.getItem('cs_user');
      if (!savedUser) {
        console.error('No user found');
        return;
      }
      
      const userData = JSON.parse(savedUser);
      const token = userData.token;
      
      if (!token) {
        console.error('No token found in user data');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/albums/${album._id}/ratings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rating: rating,
          userId: user._id
        })
      });
      
      if (response.ok) {
        setUserRating(rating);
        loadCommentsAndRatings(); // Reload ratings
      } else {
        const errorData = await response.json();
        console.error('Error submitting rating:', errorData);
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId) => {
    if (!isAuthenticated || !album?._id) return;
    
    try {
      const savedUser = localStorage.getItem('cs_user');
      if (!savedUser) {
        console.error('No user found');
        return;
      }
      
      const userData = JSON.parse(savedUser);
      const token = userData.token;
      
      if (!token) {
        console.error('No token found in user data');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/albums/${album._id}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        loadCommentsAndRatings(); // Reload comments
      } else {
        const errorData = await response.json();
        console.error('Error deleting comment:', errorData);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  // Update comment
  const handleUpdateComment = async (commentId, newContent) => {
    if (!isAuthenticated || !album?._id || !newContent.trim()) return;
    
    try {
      const savedUser = localStorage.getItem('cs_user');
      if (!savedUser) {
        console.error('No user found');
        return;
      }
      
      const userData = JSON.parse(savedUser);
      const token = userData.token;
      
      if (!token) {
        console.error('No token found in user data');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/albums/${album._id}/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: newContent.trim()
        })
      });
      
      if (response.ok) {
        setEditingComments(prev => ({ ...prev, [commentId]: false }));
        setEditContents(prev => ({ ...prev, [commentId]: newContent }));
        loadCommentsAndRatings(); // Reload comments
      } else {
        const errorData = await response.json();
        console.error('Error updating comment:', errorData);
      }
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  // Read album id from hash: #/album/<id>
  // Use state to track hash changes and force re-render
  const [hash, setHash] = useState(window.location.hash || "#/");
  
  // Update hash state when hash changes
  useEffect(() => {
    const handleHashChange = () => {
      setHash(window.location.hash || "#/");
    };
    
    window.addEventListener('hashchange', handleHashChange);
    // Also check on mount in case hash was set before component mounted
    handleHashChange();
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);
  
  const albumId = useMemo(() => {
    const match = hash.match(/^#\/album\/([^/?#]+)/);
    return match ? decodeURIComponent(match[1]) : "";
  }, [hash]);

  useEffect(() => {
    if (!albumId) {
      setIsLoading(false);
      setError("Không tìm thấy album ID");
      return;
    }
    
    let mounted = true;
    setIsLoading(true);
    setError("");
    setAlbum(null); // Clear previous album data
    
    Promise.all([
      fetch(`http://localhost:5000/api/albums/${albumId}`).then((r) => r.json()),
      fetch("http://localhost:5000/api/songs").then((r) => r.json()),
      fetch("http://localhost:5000/api/albums").then((r) => r.json()),
    ])
      .then(([albumData, songsData, albumsData]) => {
        if (!mounted) return;
        if (albumData?.error) throw new Error(albumData.error);
        setAlbum(albumData);
        setAllSongs(songsData || []);
        setAllAlbums(albumsData || []);
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

  // Load comments and ratings when album is loaded
  useEffect(() => {
    if (album?._id) {
      loadCommentsAndRatings();
    }
  }, [album?._id]);

  const songs = useMemo(() => {
    const id = String(album?._id || albumId);
    return allSongs.filter((s) => {
      const a = s.album;
      if (!a) return false;
      const aid = typeof a === "string" ? a : a._id;
      return String(aid) === id;
    });
  }, [allSongs, album, albumId]);

  // Get other albums by the same artist
  const relatedAlbums = useMemo(() => {
    if (!album || !allAlbums.length) return [];
    const currentArtist = album.artist ? album.artist.toLowerCase().trim() : '';
    if (!currentArtist) return [];
    
    const filtered = allAlbums.filter(a => {
      if (!a || !a._id) return false;
      if (String(a._id) === String(album._id)) return false;
      if (!a.artist) return false;
      const otherArtist = a.artist.toLowerCase().trim();
      return otherArtist === currentArtist && otherArtist.length > 0;
    });
    
    return filtered.slice(0, 4); // Show max 4 related albums
  }, [album, allAlbums]);

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
      <main className="main-content" style={{ width: "100%", flex: 1, minWidth: 0 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <section className="album-detail-section recommend-section" style={{ width: "100%", padding: 20, background: "linear-gradient(180deg, #0f2a3a 0%, #15161a 70%)", borderRadius: 12 }}>
          <div className="album-detail-header" style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 12 }}>
            <img className="album-detail-cover" src={withMediaBase(album.cover) || "/default-cover.png"} alt={album.name} style={{ width: 200, height: 200, borderRadius: 12, objectFit: "cover", boxShadow: "0 10px 30px rgba(0,0,0,0.4)" }} />
            <div className="album-detail-info">
              <div className="album-detail-type" style={{ color: "#89b4fa", textTransform: "uppercase", letterSpacing: 1, fontSize: 14, marginBottom: 6 }}>Album</div>
              <div className="album-detail-title logo-gradient" style={{ fontSize: 64, lineHeight: 1, marginBottom: 10 }}>{album.name}</div>
              <div className="album-detail-meta" style={{ color: "#cfd3da", marginBottom: 14, fontSize: 16 }}>
                  <span 
                    className="album-detail-artist"
                    style={{ 
                      color: "#fff", 
                      cursor: "pointer", 
                      textDecoration: "none",
                      transition: "color 0.2s ease"
                    }}
                    onMouseEnter={(e) => e.target.style.color = "#e5e7eb"}
                    onMouseLeave={(e) => e.target.style.color = "#fff"}
                  onClick={async () => {
                    try {
                      // Trim whitespace from artist name
                      const cleanArtistName = album.artist.trim();
                      
                      // Find artist by name to get the ID
                      const response = await fetch(`http://localhost:5000/api/artists/search?name=${encodeURIComponent(cleanArtistName)}`);
                      if (response.ok) {
                        const artists = await response.json();
                        if (artists.length > 0) {
                          // Use the first matching artist's ID
                          window.location.hash = `#/artist/${encodeURIComponent(artists[0]._id)}`;
                        } else {
                          // Fallback to artist name - ArtistDetail will handle it
                          window.location.hash = `#/artist/${encodeURIComponent(cleanArtistName)}`;
                        }
                      } else {
                        // Fallback to artist name - ArtistDetail will handle it
                        window.location.hash = `#/artist/${encodeURIComponent(cleanArtistName)}`;
                      }
                    } catch (error) {
                      console.error('Error finding artist:', error);
                      // Fallback to artist name - ArtistDetail will handle it
                      window.location.hash = `#/artist/${encodeURIComponent(album.artist.trim())}`;
                    }
                  }}
                >
                  {album.artist}
                </span>
                {" • "}{songs.length} bài • {formatTotalDuration(totalDuration)}
              </div>
              {album.genres && album.genres.length > 0 && (
                <div className="album-detail-genres" style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="album-genres-label" style={{ color: "#89b4fa", fontSize: 14 }}>Thể loại</div>
                  <div className="album-genres-list" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {album.genres.map((genre, index) => (
                      <span
                        key={index}
                        className="album-genre-tag"
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
              <div className="album-detail-actions" style={{ display: "flex", gap: 10 }}>
                <button className="album-play-button spotify-btn playpause" onClick={() => songs.length && playAt(0)} title="Phát album" style={{ transform: "scale(1.2)" }}>
                  <FaPlay />
                </button>
                <button className={`album-shuffle-button spotify-btn shuffle${shuffle ? " active" : ""}`} onClick={() => setShuffle((s) => !s)} title="Shuffle">
                  <FaRandom />
                </button>
              </div>
            </div>
          </div>

          <div style={{ border: "1px solid #2e2e37", borderRadius: 12, overflow: "hidden", background: "#1b1c22" }}>
            <div className="album-song-list-header" style={{ display: "grid", gridTemplateColumns: "48px 1fr 140px 80px", padding: "10px 16px", background: "#20212a", color: "#b3b3b3", fontSize: 14 }}>
              <div style={{ textAlign: "right", paddingRight: 12 }}>#</div>
              <div>Tiêu đề</div>
              <div className="album-song-artist-header">Nghệ sĩ</div>
              <div className="album-song-play-header" style={{ textAlign: "center" }}>Phát</div>
            </div>

            {songs.map((s, idx) => {
              const isCurrent = currentIdx !== null && songs[currentIdx]?._id === s._id;
              return (
                <div
                  key={s._id}
                  className="album-song-item"
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
                  <div className="album-song-number" style={{ textAlign: "right", paddingRight: 12, color: "#b3b3b3" }}>{idx + 1}</div>
                  <div className="album-song-info" style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                    <img src={withMediaBase(s.cover) || "/default-cover.png"} alt={s.title} style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="album-song-title" style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.title}</div>
                      <div className="album-song-artist-name" style={{ color: "#9aa0a6", fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{album.artist}</div>
                    </div>
                  </div>
                  <div className="album-song-artist-column" style={{ color: "#cfd3da" }}>{s.artist}</div>
                  <div className="album-song-play-button" style={{ display: "flex", justifyContent: "center" }}>
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

        {/* Related Albums Section */}
        {relatedAlbums.length > 0 && (
          <section className="related-albums-section" style={{ marginTop: "2rem", padding: "1.5rem", background: "rgba(255, 255, 255, 0.05)", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
            <h3 className="related-albums-title" style={{ color: "#fff", marginBottom: "1rem", fontSize: "1.2rem", fontWeight: "600" }}>Album khác của {album.artist}</h3>
            <div className="related-albums-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
              {relatedAlbums.map((relatedAlbum) => {
                const albumId = relatedAlbum._id;
                if (!albumId) return null;
                
                return (
                <div
                  key={relatedAlbum._id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Navigate to the album - use the relatedAlbum's ID directly
                    const targetAlbumId = relatedAlbum._id;
                    if (!targetAlbumId) {
                      console.error('No album ID found');
                      return;
                    }
                    
                    const targetHash = `#/album/${encodeURIComponent(targetAlbumId)}`;
                    console.log('Clicking album card:', {
                      name: relatedAlbum.name,
                      id: targetAlbumId,
                      currentHash: window.location.hash,
                      targetHash: targetHash
                    });
                    
                    // Set hash - this should trigger hashchange event
                    window.location.hash = targetHash;
                    
                    // Force router re-render by dispatching hashchange event
                    // The router in main.jsx listens to this and will force re-render
                    const hashChangeEvent = new Event('hashchange', {
                      bubbles: true,
                      cancelable: true
                    });
                    window.dispatchEvent(hashChangeEvent);
                  }}
                  className="related-album-card"
                  style={{ 
                    cursor: "pointer",
                    padding: "1rem", 
                    background: "rgba(255, 255, 255, 0.05)", 
                    borderRadius: "8px",
                    transition: "all 0.2s ease",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    position: "relative",
                    touchAction: "manipulation",
                    WebkitTapHighlightColor: "rgba(29, 185, 84, 0.3)",
                    display: "block",
                    color: "inherit",
                    zIndex: 1000
                  }}
                  onMouseEnter={(e) => {
                    if (window.innerWidth > 768) {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (window.innerWidth > 768) {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }
                  }}
                >
                  <img 
                    className="related-album-cover"
                    src={withMediaBase(relatedAlbum.cover) || "/default-cover.png"} 
                    alt={relatedAlbum.name} 
                    style={{ 
                      width: "100%", 
                      height: "120px", 
                      borderRadius: "6px", 
                      objectFit: "cover",
                      marginBottom: "0.5rem",
                      pointerEvents: "none",
                      userSelect: "none"
                    }} 
                  />
                  <div className="related-album-name" style={{ color: "#fff", fontWeight: "600", fontSize: "0.9rem", marginBottom: "0.25rem", pointerEvents: "none", userSelect: "none" }}>
                    {relatedAlbum.name}
                  </div>
                  <div className="related-album-year" style={{ color: "#b3b3b3", fontSize: "0.8rem", pointerEvents: "none", userSelect: "none" }}>
                    {relatedAlbum.releaseDate ? new Date(relatedAlbum.releaseDate).getFullYear() : "N/A"}
                  </div>
                </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Album Rating Section */}
        <section style={{ 
          marginTop: "2rem", 
          padding: "1.5rem", 
          background: "rgba(255, 255, 255, 0.05)", 
          borderRadius: "12px", 
          border: "1px solid rgba(255, 255, 255, 0.1)"
        }}>
          <h3 style={{ 
            color: "#fff", 
            marginBottom: "1rem", 
            fontSize: "1.2rem", 
            fontWeight: "600"
          }}>
            ⭐ Đánh giá Album
          </h3>
          
          {/* Rating Display */}
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "1rem", 
            marginBottom: "1rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <div style={{ 
                color: "#fff", 
                fontSize: "2rem", 
                fontWeight: "700"
              }}>
                {albumRating.average.toFixed(1)}
              </div>
              <div style={{ color: "#b3b3b3", fontSize: "0.9rem" }}>/ 5.0</div>
            </div>
            <div style={{ 
              color: "#b3b3b3", 
              fontSize: "0.8rem",
              padding: "0.25rem 0.5rem",
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "12px"
            }}>
              {albumRating.count} đánh giá
            </div>
          </div>
          
          {/* Rating Breakdown */}
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = albumRating.breakdown[rating] || 0;
                const percentage = albumRating.count > 0 ? (count / albumRating.count) * 100 : 0;
                
                return (
                  <div key={rating} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{ 
                      color: "#fff", 
                      fontSize: "0.8rem", 
                      minWidth: "16px",
                      fontWeight: "500"
                    }}>
                      {rating}
                    </div>
                    <div style={{ 
                      flex: 1, 
                      height: "6px", 
                      background: "rgba(255, 255, 255, 0.1)", 
                      borderRadius: "3px",
                      overflow: "hidden"
                    }}>
                      <div style={{ 
                        height: "100%", 
                        background: rating >= 4 ? "#1db954" : 
                                   rating >= 3 ? "#ffa500" : "#ff6b6b",
                        width: `${percentage}%`,
                        borderRadius: "3px",
                        transition: "width 0.3s ease"
                      }}></div>
                    </div>
                    <div style={{ 
                      color: "#b3b3b3", 
                      fontSize: "0.8rem", 
                      minWidth: "24px",
                      textAlign: "right"
                    }}>
                      {count}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Rating Buttons */}
          {isAuthenticated ? (
            <div style={{ 
              padding: "1rem",
              background: "rgba(255, 255, 255, 0.03)",
              borderRadius: "8px",
              border: "1px solid rgba(255, 255, 255, 0.05)"
            }}>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ color: "#b3b3b3", fontSize: "0.9rem" }}>Đánh giá của bạn:</span>
                <div style={{ display: "flex", gap: "0.25rem" }}>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      style={{
                        background: userRating === rating ? "#1db954" : "rgba(255, 255, 255, 0.1)",
                        border: userRating === rating ? "1px solid #1db954" : "1px solid rgba(255, 255, 255, 0.2)",
                        color: userRating === rating ? "#fff" : "#b3b3b3",
                        padding: "0.5rem",
                        borderRadius: "50%",
                        fontSize: "0.9rem",
                        fontWeight: "600",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        width: "36px",
                        height: "36px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: userRating === rating ? "0 2px 8px rgba(29, 185, 84, 0.3)" : "none"
                      }}
                      onClick={() => handleSubmitRating(rating)}
                      onMouseEnter={(e) => {
                        if (userRating !== rating) {
                          e.target.style.background = "rgba(29, 185, 84, 0.3)";
                          e.target.style.color = "#1db954";
                          e.target.style.transform = "scale(1.05)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (userRating !== rating) {
                          e.target.style.background = "rgba(255, 255, 255, 0.1)";
                          e.target.style.color = "#b3b3b3";
                          e.target.style.transform = "scale(1)";
                        }
                      }}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              </div>
              {userRating > 0 && (
                <div style={{ 
                  color: "#1db954", 
                  fontSize: "0.8rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem"
                }}>
                  ✅ Đã đánh giá {userRating}/5 sao
                </div>
              )}
            </div>
          ) : (
            <div style={{ 
              color: "#b3b3b3", 
              fontSize: "0.9rem",
              padding: "0.75rem",
              background: "rgba(255, 255, 255, 0.03)",
              borderRadius: "6px",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              textAlign: "center"
            }}>
              🔒 Vui lòng đăng nhập để đánh giá album
            </div>
          )}
        </section>

        {/* Comments Section */}
        <section style={{ marginTop: "2rem", padding: "1.5rem", background: "rgba(255, 255, 255, 0.05)", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
          <h3 style={{ color: "#fff", marginBottom: "1rem", fontSize: "1.2rem", fontWeight: "600" }}>Bình luận ({comments.length})</h3>
          
          {/* Comment Form */}
          {isAuthenticated ? (
            <div style={{ marginBottom: "1.5rem" }}>
              <textarea 
                placeholder="Chia sẻ suy nghĩ của bạn về album này..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: "80px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  padding: "0.75rem",
                  color: "#fff",
                  fontSize: "0.9rem",
                  resize: "vertical",
                  outline: "none"
                }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                <button 
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim()}
                  style={{
                    background: newComment.trim() ? "#1db954" : "rgba(255, 255, 255, 0.1)",
                    border: "none",
                    color: newComment.trim() ? "#fff" : "#b3b3b3",
                    padding: "0.5rem 1.5rem",
                    borderRadius: "20px",
                    fontSize: "0.9rem",
                    cursor: newComment.trim() ? "pointer" : "not-allowed",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    if (newComment.trim()) {
                      e.target.style.background = "#1ed760";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (newComment.trim()) {
                      e.target.style.background = "#1db954";
                    }
                  }}
                >
                  Đăng bình luận
                </button>
              </div>
            </div>
          ) : (
            <div style={{ 
              marginBottom: "1.5rem", 
              padding: "1rem", 
              background: "rgba(255, 255, 255, 0.03)", 
              borderRadius: "8px",
              textAlign: "center",
              color: "#b3b3b3"
            }}>
              Vui lòng đăng nhập để bình luận
            </div>
          )}
          
          {/* Comments List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {comments.length > 0 ? (
              comments.map((comment) => {
                const isOwner = user?._id && comment.user && user._id.toString() === comment.user.toString();
                const isEditing = editingComments[comment._id] || false;
                const editContent = editContents[comment._id] || comment.content;
                
                // Generate avatar colors based on username
                const getAvatarColors = (name) => {
                  const colors = [
                    ['#1db954', '#1ed760'], // Green
                    ['#8b5cf6', '#a78bfa'], // Purple
                    ['#ff6b6b', '#ff8e8e'], // Red
                    ['#3b82f6', '#60a5fa'], // Blue
                    ['#f59e0b', '#fbbf24'], // Orange
                    ['#10b981', '#34d399'], // Emerald
                    ['#ef4444', '#f87171'], // Rose
                    ['#8b5cf6', '#c4b5fd'], // Violet
                  ];
                  const index = name.charCodeAt(0) % colors.length;
                  return colors[index];
                };
                
                const avatarColors = getAvatarColors(comment.userName || 'User');
                
                return (
                  <div key={comment._id} style={{ 
                    padding: "1rem", 
                    background: "rgba(255, 255, 255, 0.03)", 
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                    position: "relative"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                      <div style={{ position: "relative" }}>
                        {comment.userAvatar ? (
                          <img 
                            src={withMediaBase(comment.userAvatar)} 
                            alt={comment.userName}
                            style={{ 
                              width: "40px", 
                              height: "40px", 
                              borderRadius: "50%", 
                              objectFit: "cover",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                              display: "block"
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : null}
                        <div style={{ 
                          width: "40px", 
                          height: "40px", 
                          borderRadius: "50%", 
                          background: `linear-gradient(45deg, ${avatarColors[0]}, ${avatarColors[1]})`,
                          display: comment.userAvatar ? "none" : "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: "1rem",
                          fontWeight: "bold",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                          position: comment.userAvatar ? "absolute" : "static",
                          top: comment.userAvatar ? "0" : "auto",
                          left: comment.userAvatar ? "0" : "auto"
                        }}>
                          {comment.userName ? comment.userName.charAt(0).toUpperCase() : 'U'}
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: "#fff", fontSize: "0.9rem", fontWeight: "600" }}>
                          {comment.userName || 'Người dùng'}
                        </div>
                        <div style={{ color: "#b3b3b3", fontSize: "0.8rem" }}>
                          {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString('vi-VN') : 'Vừa xong'}
                        </div>
                      </div>
                      
                      {/* Action buttons for comment owner */}
                      {isOwner && (
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button
                            onClick={() => {
                              if (isEditing) {
                                setEditingComments(prev => ({ ...prev, [comment._id]: false }));
                                setEditContents(prev => ({ ...prev, [comment._id]: comment.content }));
                              } else {
                                setEditingComments(prev => ({ ...prev, [comment._id]: true }));
                                setEditContents(prev => ({ ...prev, [comment._id]: comment.content }));
                              }
                            }}
                            style={{
                              background: "transparent",
                              border: "1px solid rgba(255, 255, 255, 0.2)",
                              color: "#b3b3b3",
                              padding: "0.25rem 0.5rem",
                              borderRadius: "4px",
                              fontSize: "0.8rem",
                              cursor: "pointer",
                              transition: "all 0.2s ease"
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = "rgba(255, 255, 255, 0.1)";
                              e.target.style.color = "#fff";
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = "transparent";
                              e.target.style.color = "#b3b3b3";
                            }}
                          >
                            {isEditing ? 'Hủy' : 'Sửa'}
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment._id)}
                            style={{
                              background: "transparent",
                              border: "1px solid rgba(239, 68, 68, 0.3)",
                              color: "#ef4444",
                              padding: "0.25rem 0.5rem",
                              borderRadius: "4px",
                              fontSize: "0.8rem",
                              cursor: "pointer",
                              transition: "all 0.2s ease"
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = "rgba(239, 68, 68, 0.1)";
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = "transparent";
                            }}
                          >
                            Xóa
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Comment content */}
                    {isEditing ? (
                      <div>
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContents(prev => ({ ...prev, [comment._id]: e.target.value }))}
                          style={{
                            width: "100%",
                            minHeight: "60px",
                            background: "rgba(255, 255, 255, 0.05)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            borderRadius: "6px",
                            padding: "0.5rem",
                            color: "#fff",
                            fontSize: "0.9rem",
                            resize: "vertical",
                            outline: "none"
                          }}
                        />
                        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                          <button
                            onClick={() => handleUpdateComment(comment._id, editContent)}
                            style={{
                              background: "#1db954",
                              border: "none",
                              color: "#fff",
                              padding: "0.5rem 1rem",
                              borderRadius: "4px",
                              fontSize: "0.8rem",
                              cursor: "pointer",
                              transition: "all 0.2s ease"
                            }}
                            onMouseEnter={(e) => e.target.style.background = "#1ed760"}
                            onMouseLeave={(e) => e.target.style.background = "#1db954"}
                          >
                            Lưu
                          </button>
                          <button
                            onClick={() => {
                              setEditingComments(prev => ({ ...prev, [comment._id]: false }));
                              setEditContents(prev => ({ ...prev, [comment._id]: comment.content }));
                            }}
                            style={{
                              background: "transparent",
                              border: "1px solid rgba(255, 255, 255, 0.2)",
                              color: "#b3b3b3",
                              padding: "0.5rem 1rem",
                              borderRadius: "4px",
                              fontSize: "0.8rem",
                              cursor: "pointer",
                              transition: "all 0.2s ease"
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = "rgba(255, 255, 255, 0.1)";
                              e.target.style.color = "#fff";
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = "transparent";
                              e.target.style.color = "#b3b3b3";
                            }}
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ color: "#e5e7eb", fontSize: "0.9rem", lineHeight: "1.5" }}>
                        {comment.content}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div style={{ 
                textAlign: "center", 
                color: "#b3b3b3", 
                padding: "2rem",
                fontSize: "0.9rem"
              }}>
                Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
              </div>
            )}
          </div>
        </section>
        </div>
      </main>

      {/* GlobalPlayer is persistent; remove local bar */}
    </div>
  );
}

export default AlbumDetail;


