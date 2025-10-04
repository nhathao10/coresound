import { useEffect, useState, useMemo } from "react";
import { FaPlay, FaPause, FaCalendarAlt, FaGlobe, FaUsers, FaHeadphones, FaCheckCircle } from "react-icons/fa";
import { usePlayer } from "./PlayerContext.jsx";
import Header from "./Header.jsx";

function ArtistDetail() {
  const [artist, setArtist] = useState(null);
  const [allSongs, setAllSongs] = useState([]);
  const [allAlbums, setAllAlbums] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [followedArtists, setFollowedArtists] = useState(new Set());

  const withMediaBase = (p) => (p && p.startsWith("/uploads") ? `http://localhost:5000${p}` : p);

  // Read artist id from hash: #/artist/<id>
  const artistId = useMemo(() => {
    const hash = window.location.hash || "#/";
    const match = hash.match(/^#\/artist\/([^/?#]+)/);
    return match ? decodeURIComponent(match[1]) : "";
  }, []);

  const {
    currentIdx,
    isPlaying,
    queue,
    current,
    setQueueAndPlay,
    setCurrentIdx,
    setIsPlaying,
    setQueueContext,
  } = usePlayer();

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setError("");
    
    Promise.all([
      fetch(`http://localhost:5000/api/artists/${artistId}`).then((r) => r.json()),
      fetch("http://localhost:5000/api/songs").then((r) => r.json()),
      fetch("http://localhost:5000/api/albums").then((r) => r.json()),
    ])
      .then(([artistData, songsData, albumsData]) => {
        if (!mounted) return;
        if (artistData?.error) throw new Error(artistData.error);
        
        setArtist(artistData);
        setAllSongs(songsData || []);
        setAllAlbums(albumsData || []);
        document.title = `${artistData.name} • CoreSound`;
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e.message || String(e));
      })
      .finally(() => mounted && setIsLoading(false));
      
    return () => {
      mounted = false;
    };
  }, [artistId]);

  // Filter songs and albums by artist
  const artistSongs = useMemo(() => {
    if (!artist) return [];
    return allSongs.filter(song => 
      song.artist && song.artist.toLowerCase().includes(artist.name.toLowerCase())
    );
  }, [allSongs, artist]);

  const artistAlbums = useMemo(() => {
    if (!artist) return [];
    // First try to match by artist name, then fallback to any album that contains artist name
    return allAlbums.filter(album => {
      if (!album.artist) return false;
      
      // Try exact match first
      if (album.artist.toLowerCase() === artist.name.toLowerCase()) {
        return true;
      }
      
      // Then try partial match
      return album.artist.toLowerCase().includes(artist.name.toLowerCase());
    });
  }, [allAlbums, artist]);

  const toggleFollowArtist = async (artistId) => {
    const isCurrentlyFollowed = followedArtists.has(artistId);
    const action = isCurrentlyFollowed ? 'unfollow' : 'follow';
    
    try {
      const response = await fetch(`http://localhost:5000/api/artists/${artistId}/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update follow status');
      }
      
      // Update local follow state
      setFollowedArtists(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyFollowed) {
          newSet.delete(artistId);
        } else {
          newSet.add(artistId);
        }
        return newSet;
      });
      
      // Update artist followers count
      setArtist(prev => prev ? { ...prev, followers: data.followers } : null);
      
    } catch (error) {
      console.error('Error updating follow status:', error);
      alert('Không thể cập nhật trạng thái theo dõi. Vui lòng thử lại.');
    }
  };

  const playArtistSongs = () => {
    if (artistSongs.length === 0) return;
    setQueueAndPlay(artistSongs, 0);
    setQueueContext("artist");
  };

  const playSong = (idx) => {
    const queueMismatch = !queue || queue.length !== artistSongs.length || artistSongs.some((s, i) => queue[i]?._id !== s._id);
    if (queueMismatch) {
      setQueueAndPlay(artistSongs, idx);
    } else {
      setCurrentIdx(idx);
      setIsPlaying(true);
    }
    setQueueContext("artist");
  };

  if (isLoading) {
    return (
      <div className="music-app dark-theme" style={{ padding: "2rem", textAlign: "center" }}>
        <div style={{ color: "#b3b3b3", fontSize: "1.2rem" }}>Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="music-app dark-theme" style={{ padding: "2rem", textAlign: "center" }}>
        <div style={{ color: "#ff6b6b", fontSize: "1.2rem", marginBottom: "1rem" }}>
          Lỗi: {error}
        </div>
        <button
          onClick={() => window.history.back()}
          style={{
            background: "#1db954",
            color: "#fff",
            border: "none",
            borderRadius: "25px",
            padding: "0.75rem 2rem",
            fontSize: "1rem",
            cursor: "pointer"
          }}
        >
          Quay lại
        </button>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="music-app dark-theme" style={{ padding: "2rem", textAlign: "center" }}>
        <div style={{ color: "#b3b3b3", fontSize: "1.2rem" }}>Không tìm thấy nghệ sĩ</div>
      </div>
    );
  }

  return (
    <div className="music-app dark-theme">
      <Header showSearch={true} showSearchResults={false} />

      {/* Main Content */}
      <main style={{ paddingTop: "80px" }}>
        {/* Hero Section */}
        <div style={{
          background: "linear-gradient(180deg, rgba(29, 185, 84, 0.3) 0%, rgba(24, 24, 27, 0.8) 100%)",
          padding: "3rem 2rem",
          display: "flex",
          alignItems: "flex-end",
          gap: "2rem",
          minHeight: "400px"
        }}>
        {/* Artist Avatar */}
        <img
          src={withMediaBase(artist.avatar) || "https://via.placeholder.com/300x300/18181b/fff?text=Artist"}
          alt={artist.name}
          style={{
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            objectFit: "cover",
            border: "4px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)"
          }}
        />
        
        {/* Artist Info */}
        <div style={{ flex: 1, color: "#fff" }}>
          <div style={{ fontSize: "0.9rem", fontWeight: "600", marginBottom: "0.5rem", opacity: 0.8 }}>
            NGHỆ SĨ
          </div>
          <h1 style={{ 
            fontSize: "4rem", 
            fontWeight: "900", 
            margin: "0 0 1rem 0",
            lineHeight: "1.1",
            display: "flex",
            alignItems: "center",
            gap: "1rem"
          }}>
            {artist.name}
            {artist.isVerified && (
              <FaCheckCircle 
                style={{ 
                  color: "#1db954", 
                  fontSize: "2.5rem",
                  filter: "drop-shadow(0 2px 4px rgba(29, 185, 84, 0.3))"
                }} 
                title="Nghệ sĩ đã xác minh"
              />
            )}
          </h1>
          
          {/* Stats */}
          <div style={{ display: "flex", alignItems: "center", gap: "2rem", marginBottom: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FaUsers style={{ color: "#1db954" }} />
              <span>{(artist.followers || 0).toLocaleString("vi-VN")} người theo dõi</span>
            </div>
            {artist.monthlyListeners && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <FaHeadphones style={{ color: "#1db954" }} />
                <span>{artist.monthlyListeners.toLocaleString("vi-VN")} người nghe/tháng</span>
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              onClick={playArtistSongs}
              disabled={artistSongs.length === 0}
              style={{
                background: "#1db954",
                border: "none",
                borderRadius: "50px",
                color: "#fff",
                padding: "1rem 2rem",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: artistSongs.length === 0 ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                opacity: artistSongs.length === 0 ? 0.5 : 1
              }}
            >
              <FaPlay />
              Phát tất cả
            </button>
            
            <button
              onClick={() => toggleFollowArtist(artist._id)}
              style={{
                background: followedArtists.has(artist._id) ? "rgba(29, 185, 84, 0.2)" : "transparent",
                border: `2px solid ${followedArtists.has(artist._id) ? "rgba(29, 185, 84, 0.6)" : "rgba(255, 255, 255, 0.3)"}`,
                borderRadius: "50px",
                color: followedArtists.has(artist._id) ? "#1db954" : "#fff",
                padding: "1rem 2rem",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              {followedArtists.has(artist._id) ? "Đang theo dõi" : "Theo dõi"}
            </button>
          </div>
        </div>
      </div>

        {/* Content */}
        <div style={{ padding: "2rem" }}>
        {/* Artist Info */}
        {(artist.bio || artist.country || artist.debutYear) && (
          <section style={{ marginBottom: "3rem" }}>
            <h2 style={{ color: "#fff", fontSize: "1.5rem", marginBottom: "1rem" }}>Thông tin</h2>
            <div style={{ 
              background: "#1e1e24", 
              borderRadius: "12px", 
              padding: "1.5rem",
              border: "1px solid rgba(255, 255, 255, 0.05)"
            }}>
              {artist.bio && (
                <p style={{ color: "#b3b3b3", lineHeight: "1.6", marginBottom: "1rem" }}>
                  {artist.bio}
                </p>
              )}
              
              <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem" }}>
                {artist.country && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <FaGlobe style={{ color: "#1db954" }} />
                    <span style={{ color: "#fff" }}>{artist.country}</span>
                  </div>
                )}
                {artist.debutYear && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <FaCalendarAlt style={{ color: "#1db954" }} />
                    <span style={{ color: "#fff" }}>Debut: {artist.debutYear}</span>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Popular Songs */}
        {artistSongs.length > 0 && (
          <section style={{ marginBottom: "3rem" }}>
            <h2 style={{ color: "#fff", fontSize: "1.5rem", marginBottom: "1rem" }}>
              Bài hát nổi bật
            </h2>
            <div style={{ 
              background: "#1e1e24", 
              borderRadius: "12px", 
              padding: "1rem",
              border: "1px solid rgba(255, 255, 255, 0.05)"
            }}>
              {artistSongs.slice(0, 10).map((song, index) => (
                <div
                  key={song._id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto auto 1fr auto auto",
                    alignItems: "center",
                    gap: "1rem",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "background 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                  onClick={() => playSong(index)}
                >
                  <div style={{ 
                    color: current && current._id === song._id && isPlaying ? "#1db954" : "#b3b3b3",
                    fontSize: "1rem",
                    fontWeight: "500",
                    minWidth: "20px"
                  }}>
                    {current && current._id === song._id && isPlaying ? (
                      <FaPause style={{ fontSize: "0.9rem" }} />
                    ) : (
                      index + 1
                    )}
                  </div>
                  
                  {/* Song Cover */}
                  <img
                    src={withMediaBase(song.cover) || "https://via.placeholder.com/50x50/333/fff?text=Song"}
                    alt={song.title}
                    style={{
                      width: "50px",
                      height: "50px",
                      borderRadius: "6px",
                      objectFit: "cover"
                    }}
                  />
                  
                  <div>
                    <div style={{ 
                      color: current && current._id === song._id ? "#1db954" : "#fff",
                      fontWeight: "500",
                      marginBottom: "0.25rem"
                    }}>
                      {song.title}
                    </div>
                    <div style={{ color: "#b3b3b3", fontSize: "0.9rem" }}>
                      {song.artist}
                    </div>
                  </div>
                  
                  <div style={{ color: "#b3b3b3", fontSize: "0.9rem" }}>
                    {(song.plays || 0).toLocaleString("vi-VN")}
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playSong(index);
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#b3b3b3",
                      fontSize: "1.2rem",
                      cursor: "pointer",
                      padding: "0.5rem",
                      borderRadius: "50%",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = "rgba(29, 185, 84, 0.2)";
                      e.target.style.color = "#1db954";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "transparent";
                      e.target.style.color = "#b3b3b3";
                    }}
                  >
                    {current && current._id === song._id && isPlaying ? <FaPause /> : <FaPlay />}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Albums */}
        {artistAlbums.length > 0 && (
          <section>
            <h2 style={{ color: "#fff", fontSize: "1.5rem", marginBottom: "1rem" }}>
              Album
            </h2>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", 
              gap: "1.5rem" 
            }}>
              {artistAlbums.map((album) => (
                <div
                  key={album._id}
                  style={{
                    background: "#1e1e24",
                    borderRadius: "12px",
                    padding: "1rem",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    border: "1px solid rgba(255, 255, 255, 0.05)"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#252530";
                    e.currentTarget.style.transform = "translateY(-4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#1e1e24";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                  onClick={() => {
                    window.location.hash = `#/album/${album._id}`;
                  }}
                >
                  <img
                    src={withMediaBase(album.cover) || "https://via.placeholder.com/200x200/333/fff?text=Album"}
                    alt={album.name}
                    style={{
                      width: "100%",
                      aspectRatio: "1",
                      objectFit: "cover",
                      borderRadius: "8px",
                      marginBottom: "1rem"
                    }}
                  />
                  <h3 style={{ 
                    color: "#fff", 
                    fontSize: "1rem", 
                    fontWeight: "600",
                    margin: "0 0 0.5rem 0",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}>
                    {album.name}
                  </h3>
                  <p style={{ 
                    color: "#b3b3b3", 
                    fontSize: "0.9rem", 
                    margin: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}>
                    {album.releaseDate ? new Date(album.releaseDate).getFullYear() : ""}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
        </div>
      </main>
    </div>
  );
}

export default ArtistDetail;
