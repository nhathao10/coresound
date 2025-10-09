import { useEffect, useState } from "react";
import { usePlayer } from "./PlayerContext.jsx";
import { FaPlay, FaPause } from "react-icons/fa";
import HeartIcon from "./HeartIcon.jsx";
import AddToPlaylistIcon from "./AddToPlaylistIcon.jsx";
import AddToPlaylistModal from "./AddToPlaylistModal.jsx";
import Header from "./Header.jsx";

function PlaylistDetail() {
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hoveredSongId, setHoveredSongId] = useState(null);
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false);
  const [selectedSongForPlaylist, setSelectedSongForPlaylist] = useState(null);
  
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
        const response = await fetch(`http://localhost:5000/api/playlists/curated/${playlistId}`);
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
        <div style={{ marginBottom: 32 }}>
        
        <div style={{ display: "flex", gap: 24, alignItems: "flex-end" }}>
          <img
            src={withMediaBase(playlist.cover) || "/default-cover.png"}
            alt={playlist.name}
            style={{
              width: 200,
              height: 200,
              borderRadius: 12,
              objectFit: "cover",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)"
            }}
          />
          
          <div style={{ flex: 1 }}>
            <div style={{ color: "#b3b3b3", fontSize: 14, marginBottom: 8 }}>PLAYLIST</div>
            <h1 style={{ color: "#fff", fontSize: 48, fontWeight: 700, margin: "0 0 16px 0", lineHeight: 1.2 }}>
              {playlist.name}
            </h1>
            {playlist.description && (
              <div style={{ color: "#b3b3b3", fontSize: 16, marginBottom: 16 }}>
                {playlist.description}
              </div>
            )}
            <div style={{ color: "#b3b3b3", fontSize: 14 }}>
              {playlist.songs?.length || 0} bài hát
            </div>
          </div>
        </div>
      </div>

      {/* Play Button */}
      <div style={{ marginBottom: 32 }}>
        <button
          onClick={playPlaylist}
          style={{
            padding: "12px 32px",
            borderRadius: 50,
            border: "none",
            background: "#1db954",
            color: "#fff",
            fontSize: 16,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "scale(1.05)";
            e.target.style.background = "#1ed760";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "scale(1)";
            e.target.style.background = "#1db954";
          }}
        >
          <FaPlay />
          Phát tất cả
        </button>
      </div>

      {/* Songs List */}
      <div style={{ background: "#1e1e24", border: "1px solid #2e2e37", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "40px 1fr 1fr 40px 40px", 
          gap: 16, 
          padding: "16px 20px", 
          borderBottom: "1px solid #2e2e37", 
          background: "#1a1a20", 
          color: "#b3b3b3",
          fontSize: 14,
          fontWeight: 600
        }}>
          <div>#</div>
          <div>TÊN BÀI HÁT</div>
          <div>NGHỆ SĨ</div>
          <div></div>
          <div></div>
        </div>

        {playlist.songs && playlist.songs.length > 0 ? (
          playlist.songs.map((song, index) => (
            <div
              key={song._id}
              style={{
                display: "grid",
                gridTemplateColumns: "40px 1fr 1fr 40px 40px",
                gap: 16,
                padding: "12px 20px",
                borderBottom: "1px solid #2a2a34",
                alignItems: "center",
                cursor: "pointer",
                transition: "background-color 0.2s ease",
                background: current && current._id === song._id ? "rgba(29, 185, 84, 0.1)" : "transparent"
              }}
              onMouseEnter={(e) => {
                if (!(current && current._id === song._id)) {
                  e.currentTarget.style.backgroundColor = "#2a2a34";
                }
                setHoveredSongId(song._id);
              }}
              onMouseLeave={(e) => {
                if (!(current && current._id === song._id)) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
                setHoveredSongId(null);
              }}
              onClick={() => playSong(index)}
            >
              <div style={{ color: "#b3b3b3", fontSize: 14 }}>
                {current && current._id === song._id && isPlaying ? (
                  <FaPause style={{ color: "#1db954" }} />
                ) : (
                  index + 1
                )}
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <img
                  src={withMediaBase(song.cover) || "/default-cover.png"}
                  alt={song.title}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 6,
                    objectFit: "cover"
                  }}
                />
                <div>
                  <div style={{ 
                    color: current && current._id === song._id ? "#1db954" : "#fff", 
                    fontSize: 16, 
                    fontWeight: 500 
                  }}>
                    {song.title}
                  </div>
                </div>
              </div>
              
              <div style={{ color: "#b3b3b3", fontSize: 14 }}>
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
                    setSelectedSongForPlaylist(song);
                    setShowAddToPlaylistModal(true);
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

      {/* Add to Playlist Modal */}
      <AddToPlaylistModal
        isOpen={showAddToPlaylistModal}
        onClose={() => {
          setShowAddToPlaylistModal(false);
          setSelectedSongForPlaylist(null);
        }}
        song={selectedSongForPlaylist}
        onSuccess={() => {
          // Trigger playlist refresh by dispatching custom event
          window.dispatchEvent(new CustomEvent('playlistUpdated'));
        }}
      />
      </div>
    </div>
  );
}

export default PlaylistDetail;
