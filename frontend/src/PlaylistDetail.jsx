import { useEffect, useState } from "react";
import { usePlayer } from "./PlayerContext.jsx";
import { FaPlay, FaPause } from "react-icons/fa";
import HeartIcon from "./HeartIcon.jsx";
import AddToPlaylistIcon from "./AddToPlaylistIcon.jsx";
import Header from "./Header.jsx";

function PlaylistDetail() {
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hoveredSongId, setHoveredSongId] = useState(null);
  
  const { setQueueAndPlay, currentIdx, isPlaying, setIsPlaying, current } = usePlayer();
  
  const withMediaBase = (p) => (p && p.startsWith("/uploads") ? `http://localhost:5000${p}` : p);

  useEffect(() => {
    const playlistId = window.location.hash.split('/')[2];
    if (!playlistId) {
      setError("Không tìm thấy playlist");
      setLoading(false);
      return;
    }

    const fetchPlaylist = async () => {
      try {
        // Try user playlist first
        const token = localStorage.getItem('cs_user') ? JSON.parse(localStorage.getItem('cs_user')).token : null;
        let response = await fetch(`http://localhost:5000/api/user-playlists/${playlistId}/songs`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        if (response.ok) {
          const data = await response.json();
          setPlaylist(data);
          return;
        }
        
        // If not found, try curated playlist
        response = await fetch(`http://localhost:5000/api/curated-playlists/${playlistId}`);
        if (!response.ok) {
          throw new Error('Không tìm thấy playlist');
        }
        const data = await response.json();
        setPlaylist(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylist();
  }, []);

  const playPlaylist = () => {
    if (!playlist || !playlist.songs || playlist.songs.length === 0) return;
    
    // Convert playlist songs to full song objects
    const playlistSongs = playlist.songs.map(song => ({
      _id: song._id,
      title: song.title,
      artist: song.artist,
      cover: song.cover,
      url: song.url
    }));
    
    setQueueAndPlay(playlistSongs, 0);
  };

  const playSong = (songIndex) => {
    if (!playlist || !playlist.songs) return;
    
    // Convert playlist songs to full song objects
    const playlistSongs = playlist.songs.map(song => ({
      _id: song._id,
      title: song.title,
      artist: song.artist,
      cover: song.cover,
      url: song.url
    }));
    
    setQueueAndPlay(playlistSongs, songIndex);
  };

  if (loading) {
    return (
      <div className="music-app dark-theme" style={{ padding: 24, textAlign: "center" }}>
        <div style={{ color: "#fff", fontSize: 18 }}>Đang tải playlist...</div>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="music-app dark-theme" style={{ padding: 24, textAlign: "center" }}>
        <div style={{ color: "#ff8080", fontSize: 18 }}>{error || "Không tìm thấy playlist"}</div>
        <button 
          onClick={() => window.location.hash = "#/"}
          style={{
            marginTop: 16,
            padding: "10px 20px",
            borderRadius: 8,
            border: "1px solid #2e2e37",
            background: "#1db954",
            color: "#fff",
            cursor: "pointer",
            fontSize: 14
          }}
        >
          Về trang chủ
        </button>
      </div>
    );
  }

  return (
    <div className="music-app dark-theme" style={{ paddingTop: 100, paddingBottom: 120 }}>
      <Header showSearch={false} />
      <div style={{ padding: "0 24px" }}>
        {/* Playlist Header */}
        <div style={{ 
          marginBottom: 40,
          background: 'linear-gradient(135deg, rgba(29, 185, 84, 0.1) 0%, rgba(0, 0, 0, 0.3) 100%)',
          borderRadius: 16,
          padding: 32,
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{ display: "flex", gap: 32, alignItems: "flex-end" }}>
            <div style={{ position: 'relative' }}>
              <img
                src={withMediaBase(playlist.cover) || "/default-cover.png"}
                alt={playlist.name}
                style={{
                  width: 240,
                  height: 240,
                  borderRadius: 16,
                  objectFit: "cover",
                  boxShadow: "0 12px 40px rgba(0, 0, 0, 0.4), 0 4px 16px rgba(29, 185, 84, 0.2)"
                }}
              />
              {/* Gradient overlay for better text contrast */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '60%',
                background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.7))',
                borderRadius: '0 0 16px 16px',
                pointerEvents: 'none'
              }} />
            </div>
            
            <div style={{ flex: 1, paddingBottom: 8 }}>
              <div style={{ 
                color: "#1db954", 
                fontSize: 12, 
                fontWeight: 600,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                marginBottom: 12,
                opacity: 0.9
              }}>
                PLAYLIST
              </div>
              <h1 style={{ 
                color: "#fff", 
                fontSize: 56, 
                fontWeight: 800, 
                margin: "0 0 20px 0", 
                lineHeight: 1.1,
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                background: 'linear-gradient(135deg, #ffffff 0%, #b3b3b3 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                {playlist.name}
              </h1>
              {playlist.description && (
                <div style={{ 
                  color: "#b3b3b3", 
                  fontSize: 18, 
                  marginBottom: 20,
                  lineHeight: 1.4,
                  maxWidth: '600px',
                  opacity: 0.9
                }}>
                  {playlist.description}
                </div>
              )}
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                color: "#b3b3b3", 
                fontSize: 16,
                fontWeight: 500
              }}>
                <span style={{
                  background: 'rgba(29, 185, 84, 0.2)',
                  padding: '6px 12px',
                  borderRadius: 20,
                  border: '1px solid rgba(29, 185, 84, 0.3)',
                  fontSize: 14
                }}>
                  {playlist.songs?.length || 0} bài hát
                </span>
                {playlist.creator ? (
                  <span style={{ opacity: 0.7 }}>
                    • Bởi {playlist.creator.name || 'Người dùng'}
                  </span>
                ) : (
                  <span style={{ opacity: 0.7 }}>
                    • Curated by CoreSound
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

      {/* Play Button */}
      <div style={{ marginBottom: 40, paddingLeft: 8 }}>
        <button
          onClick={playPlaylist}
          style={{
            padding: "16px 40px",
            borderRadius: 50,
            border: "none",
            background: "linear-gradient(135deg, #1db954 0%, #1ed760 100%)",
            color: "#fff",
            fontSize: 18,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 12,
            transition: "all 0.3s ease",
            boxShadow: "0 8px 24px rgba(29, 185, 84, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2)",
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "scale(1.05) translateY(-2px)";
            e.target.style.background = "linear-gradient(135deg, #1ed760 0%, #1db954 100%)";
            e.target.style.boxShadow = "0 12px 32px rgba(29, 185, 84, 0.4), 0 6px 16px rgba(0, 0, 0, 0.3)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "scale(1) translateY(0)";
            e.target.style.background = "linear-gradient(135deg, #1db954 0%, #1ed760 100%)";
            e.target.style.boxShadow = "0 8px 24px rgba(29, 185, 84, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2)";
          }}
        >
          <FaPlay size={18} />
          Phát tất cả
        </button>
      </div>

      {/* Songs List */}
      <div style={{ 
        background: "rgba(30, 30, 36, 0.8)", 
        border: "1px solid rgba(46, 46, 55, 0.3)", 
        borderRadius: 16, 
        overflow: "hidden",
        backdropFilter: 'blur(10px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "50px 1fr 1fr 50px 50px", 
          gap: 20, 
          padding: "20px 24px", 
          borderBottom: "1px solid rgba(46, 46, 55, 0.5)", 
          background: "linear-gradient(135deg, rgba(26, 26, 32, 0.9) 0%, rgba(30, 30, 36, 0.9) 100%)", 
          color: "#b3b3b3",
          fontSize: 14,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          <div style={{ textAlign: 'center' }}>#</div>
          <div>TÊN BÀI HÁT</div>
          <div>NGHỆ SĨ</div>
          <div style={{ textAlign: 'center' }}></div>
          <div style={{ textAlign: 'center' }}></div>
        </div>

        {playlist.songs && playlist.songs.length > 0 ? (
          playlist.songs.map((song, index) => (
            <div
              key={song._id}
              style={{
                display: "grid",
                gridTemplateColumns: "50px 1fr 1fr 50px 50px",
                gap: 20,
                padding: "16px 24px",
                borderBottom: "1px solid rgba(42, 42, 52, 0.3)",
                alignItems: "center",
                cursor: "pointer",
                transition: "all 0.3s ease",
                background: current && current._id === song._id 
                  ? "linear-gradient(135deg, rgba(29, 185, 84, 0.15) 0%, rgba(29, 185, 84, 0.05) 100%)" 
                  : "transparent",
                borderRadius: current && current._id === song._id ? "8px" : "0",
                margin: current && current._id === song._id ? "4px 8px" : "0"
              }}
              onMouseEnter={(e) => {
                if (!(current && current._id === song._id)) {
                  e.currentTarget.style.backgroundColor = "rgba(42, 42, 52, 0.6)";
                  e.currentTarget.style.transform = "translateX(4px)";
                }
                setHoveredSongId(song._id);
              }}
              onMouseLeave={(e) => {
                if (!(current && current._id === song._id)) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.transform = "translateX(0)";
                }
                setHoveredSongId(null);
              }}
              onClick={() => playSong(index)}
            >
              <div style={{ 
                color: current && current._id === song._id ? "#1db954" : "#b3b3b3", 
                fontSize: 16,
                fontWeight: current && current._id === song._id ? 600 : 400,
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {current && current._id === song._id && isPlaying ? (
                  <FaPause style={{ color: "#1db954", fontSize: 18 }} />
                ) : (
                  index + 1
                )}
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <img
                  src={withMediaBase(song.cover) || "/default-cover.png"}
                  alt={song.title}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    objectFit: "cover",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)"
                  }}
                />
                <div>
                  <div style={{ 
                    color: current && current._id === song._id ? "#1db954" : "#fff", 
                    fontSize: 17, 
                    fontWeight: current && current._id === song._id ? 600 : 500,
                    marginBottom: 2
                  }}>
                    {song.title}
                  </div>
                </div>
              </div>
              
              <div style={{ 
                color: current && current._id === song._id ? "#1db954" : "#b3b3b3", 
                fontSize: 15,
                fontWeight: current && current._id === song._id ? 500 : 400,
                opacity: current && current._id === song._id ? 1 : 0.8
              }}>
                {song.artist}
              </div>
              
              <div style={{ display: "flex", justifyContent: "center" }}>
                <HeartIcon 
                  type="song" 
                  itemId={song._id} 
                  style={{ opacity: hoveredSongId === song._id ? 1 : 0 }} 
                />
              </div>
              
              <div style={{ display: "flex", justifyContent: "center" }}>
                <AddToPlaylistIcon 
                  onClick={(e) => {
                    e.stopPropagation();
                    window.dispatchEvent(new CustomEvent('openAddToPlaylist', { 
                      detail: { song: song } 
                    }));
                  }}
                  style={{ opacity: hoveredSongId === song._id ? 1 : 0 }}
                />
              </div>
            </div>
          ))
        ) : (
          <div style={{ 
            padding: "40px 20px", 
            textAlign: "center", 
            color: "#b3b3b3",
            fontSize: 16
          }}>
            Playlist này chưa có bài hát nào
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

export default PlaylistDetail;
