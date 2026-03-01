import { useEffect, useMemo, useState, useRef } from "react";
import AdminSidebar from "./AdminSidebar.jsx";
import { useAuth } from "./AuthContext";

// Helper function for media URLs
const withMediaBase = (p) => (p && p.startsWith("/uploads") ? `${import.meta.env.VITE_API_URL}${p}` : p);

function PlaylistsAdmin() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ 
    name: "", 
    description: "", 
    isPublic: false, 
    cover: null, 
    songs: [] 
  });
  const [selectedPlaylistId, setSelectedPlaylistId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [songSearchQuery, setSongSearchQuery] = useState("");
  const selectedPlaylist = useMemo(() => playlists.find(p => p._id === selectedPlaylistId) || null, [playlists, selectedPlaylistId]);

  useEffect(() => {
    document.title = "CoreSound - Quản Lý Playlist";
    const headers = {
      'Authorization': `Bearer ${user?.token}`
    };
    
    Promise.all([
      fetch(`${import.meta.env.VITE_API_URL}/api/admin/curated-playlists`, { headers }).then(r=>r.json()),
      fetch(`${import.meta.env.VITE_API_URL}/api/songs`).then(r=>r.json()),
    ]).then(([p, s]) => {
      console.log('PlaylistsAdmin: Loaded data', { playlists: p, songs: s });
      setPlaylists(Array.isArray(p) ? p : []);
      setSongs(Array.isArray(s) ? s : []);
    }).catch((e)=> {
      console.error('PlaylistsAdmin: Error loading data', e);
      setError(e.message || String(e));
    }).finally(()=> setLoading(false));
  }, []);

  // Debug: Monitor form changes
  useEffect(() => {
    console.log('Form state changed:', { 
      name: form.name, 
      songsCount: form.songs.length, 
      creating: creating 
    });
  }, [form, creating]);

  const createPlaylist = async () => {
    console.log('createPlaylist called', { form });
    setError("");
    
    // Prevent double submission
    if (creating) {
      console.log('Already creating, ignoring request');
      return;
    }
    
    // Better validation
    if (!form.name || !form.name.trim()) {
      setError("Nhập tên playlist");
      return;
    }
    
    try {
      console.log('Starting playlist creation...');
      setCreating(true);
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("description", form.description);
      fd.append("isPublic", String(form.isPublic));
      if (form.songs.length > 0) fd.append("songs", JSON.stringify(form.songs));
      if (form.cover) fd.append("cover", form.cover);
      
      console.log('Sending request to API...');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/curated-playlists`, { 
        method: "POST", 
        headers: {
          'Authorization': `Bearer ${user?.token}`
        },
        body: fd 
      });
      console.log('API response:', res.status, res.statusText);
      const data = await res.json();
      console.log('API response data:', data);
      if (!res.ok) throw new Error(data?.error || "Tạo playlist thất bại");
      
      // Tạo object playlist với đầy đủ thông tin songs
      const newPlaylist = {
        ...data,
        songs: form.songs.map(songId => {
          const song = songs.find(s => s._id === songId);
          return song ? { _id: song._id, title: song.title, artist: song.artist, cover: song.cover } : { _id: songId, title: "Unknown", artist: "Unknown" };
        })
      };
      
      setPlaylists((prev)=> [newPlaylist, ...prev]);
      setForm({ name: "", description: "", isPublic: false, cover: null, songs: [] });
    } catch (e) {
      console.error('Error creating playlist:', e);
      setError(e.message || String(e));
    } finally {
      setCreating(false);
    }
  };

  const savePlaylist = async (playlistId, patch) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/curated-playlists/${playlistId}`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        'Authorization': `Bearer ${user?.token}`
      },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Cập nhật playlist thất bại");
    
    // Tạo object updated với đầy đủ thông tin songs
    const updatedPlaylist = {
      ...data,
      songs: patch.songs ? patch.songs.map(songId => {
        const song = songs.find(s => s._id === songId);
        return song ? { _id: song._id, title: song.title, artist: song.artist, cover: song.cover } : { _id: songId, title: "Unknown", artist: "Unknown" };
      }) : data.songs
    };
    
    setPlaylists((prev)=> prev.map((p)=> p._id === updatedPlaylist._id ? updatedPlaylist : p));
  };

  const deletePlaylist = async (playlistId) => {
    if (!confirm("Xoá playlist này?")) return;
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/curated-playlists/${playlistId}`, { 
      method: "DELETE",
      headers: {
        'Authorization': `Bearer ${user?.token}`
      }
    });
    const data = await res.json();
    if (!res.ok) return alert(data?.error || "Xoá thất bại");
    setPlaylists((prev)=> prev.filter((p)=> p._id !== playlistId));
    if (selectedPlaylistId === playlistId) setSelectedPlaylistId("");
  };

  const changeCover = async (playlistId, file) => {
    console.log('changeCover called:', { playlistId, file });
    
    if (!file) {
      console.log('No file selected');
      return;
    }
    
    const fd = new FormData();
    fd.append("cover", file);
    
    console.log('Sending FormData with cover file:', file.name);
    
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/curated-playlists/${playlistId}`, { 
      method: "PUT", 
      headers: {
        'Authorization': `Bearer ${user?.token}`
      },
      body: fd 
    });
    
    console.log('API response status:', res.status);
    const data = await res.json();
    console.log('API response data:', data);
    
    if (!res.ok) throw new Error(data?.error || "Cập nhật cover thất bại");
    setPlaylists((prev)=> prev.map((p)=> p._id === data._id ? data : p));
  };

  const attachSongToPlaylist = async (playlistId, songId) => {
    console.log('attachSongToPlaylist called', { playlistId, songId });
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/curated-playlists/${playlistId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({ 
          songs: [...playlists.find(p => p._id === playlistId)?.songs || [], songId]
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Thêm bài hát thất bại");
      
      console.log('API response:', data);
      
      // Cập nhật local state
      setPlaylists((prev)=> prev.map((p)=> {
        if (p._id === playlistId) {
          const song = songs.find(s => s._id === songId);
          console.log('Found song:', song);
          const newSong = song ? { _id: song._id, title: song.title, artist: song.artist, cover: song.cover } : { _id: songId, title: "Unknown", artist: "Unknown" };
          const updatedPlaylist = {
            ...p,
            songs: [...p.songs, newSong]
          };
          console.log('Updated playlist:', updatedPlaylist);
          return updatedPlaylist;
        }
        return p;
      }));
    } catch (error) {
      console.error('Error attaching song to playlist:', error);
      alert(error.message || 'Thêm bài hát thất bại');
    }
  };

  const removeSongFromPlaylist = async (playlistId, songId) => {
    console.log('removeSongFromPlaylist called', { playlistId, songId });
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/curated-playlists/${playlistId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({ 
          songs: playlists.find(p => p._id === playlistId)?.songs?.filter(s => s._id !== songId) || []
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Xoá bài hát thất bại");
      
      console.log('API response:', data);
      
      // Cập nhật local state
      setPlaylists((prev)=> prev.map((p)=> {
        if (p._id === playlistId) {
          const updatedPlaylist = {
            ...p,
            songs: p.songs.filter(s => s._id !== songId)
          };
          console.log('Updated playlist after removal:', updatedPlaylist);
          return updatedPlaylist;
        }
        return p;
      }));
    } catch (error) {
      console.error('Error removing song from playlist:', error);
      alert(error.message || 'Xóa bài hát thất bại');
    }
  };

  const playlistSongs = useMemo(
    () => songs.filter((s) => selectedPlaylist?.songs?.some(ps => ps._id === s._id)),
    [songs, selectedPlaylist]
  );

  // Lọc bài hát có sẵn theo từ khóa tìm kiếm (cho phần tạo playlist)
  const filteredAvailableSongs = useMemo(() => {
    if (!songs || !Array.isArray(songs)) {
      return [];
    }
    
    if (!songSearchQuery.trim()) return songs;
    
    const query = songSearchQuery.toLowerCase().trim();
    
    return songs.filter(song => {
      if (!song) return false;
      
      try {
        // Tìm kiếm theo tên bài hát
        const matchTitle = song.title?.toLowerCase()?.includes(query) || false;
        
        // Tìm kiếm theo nghệ sĩ
        const matchArtist = song.artist?.toLowerCase()?.includes(query) || false;
        
        // Tìm kiếm theo thể loại (có thể là object hoặc string)
        const genreText = typeof song.genre === 'object' ? song.genre?.name : song.genre;
        const matchGenre = genreText?.toLowerCase()?.includes(query) || false;
        
        // Tìm kiếm theo khu vực (có thể là object hoặc string)
        const regionText = typeof song.region === 'object' ? song.region?.name : song.region;
        const matchRegion = regionText?.toLowerCase()?.includes(query) || false;
        
        return matchTitle || matchArtist || matchGenre || matchRegion;
      } catch (error) {
        console.error('Error filtering song:', song, error);
        return false;
      }
    });
  }, [songs, songSearchQuery]);

  // Lọc bài hát có sẵn cho phần quản lý playlist đã chọn
  const filteredAvailableSongsForPlaylist = useMemo(() => {
    if (!songs || !Array.isArray(songs)) {
      return [];
    }
    
    // Lọc bỏ bài hát đã có trong playlist hiện tại
    const availableSongs = songs.filter(song => {
      if (!song || !selectedPlaylist) return true;
      return !selectedPlaylist.songs?.some(ps => ps._id === song._id);
    });
    
    if (!songSearchQuery.trim()) return availableSongs;
    
    const query = songSearchQuery.toLowerCase().trim();
    
    return availableSongs.filter(song => {
      if (!song) return false;
      
      try {
        // Tìm kiếm theo tên bài hát
        const matchTitle = song.title?.toLowerCase()?.includes(query) || false;
        
        // Tìm kiếm theo nghệ sĩ
        const matchArtist = song.artist?.toLowerCase()?.includes(query) || false;
        
        // Tìm kiếm theo thể loại (có thể là object hoặc string)
        const genreText = typeof song.genre === 'object' ? song.genre?.name : song.genre;
        const matchGenre = genreText?.toLowerCase()?.includes(query) || false;
        
        // Tìm kiếm theo khu vực (có thể là object hoặc string)
        const regionText = typeof song.region === 'object' ? song.region?.name : song.region;
        const matchRegion = regionText?.toLowerCase()?.includes(query) || false;
        
        return matchTitle || matchArtist || matchGenre || matchRegion;
      } catch (error) {
        console.error('Error filtering song:', song, error);
        return false;
      }
    });
  }, [songs, songSearchQuery, selectedPlaylist]);

  // Lọc playlist theo từ khóa tìm kiếm
  const filteredPlaylists = useMemo(() => {
    if (!searchQuery.trim()) return playlists;
    
    const query = searchQuery.toLowerCase().trim();
    return playlists.filter(playlist => {
      // Tìm kiếm theo tên playlist
      const matchName = playlist.name?.toLowerCase().includes(query);
      
      // Tìm kiếm theo mô tả
      const matchDescription = playlist.description?.toLowerCase().includes(query);
      
      return matchName || matchDescription;
    });
  }, [playlists, searchQuery]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Error boundary fallback
  if (error) {
    return (
      <div className="music-app dark-theme" style={{ padding: 24, textAlign: "center" }}>
        <div style={{ color: "#ff8080", fontSize: 18, marginBottom: 16 }}>Lỗi: {error}</div>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: "10px 20px",
            borderRadius: 8,
            border: "1px solid #2e2e37",
            background: "#1db954",
            color: "#fff",
            cursor: "pointer",
            fontSize: 14
          }}
        >
          Tải lại trang
        </button>
      </div>
    );
  }

  return (
    <div className="music-app dark-theme" style={{ padding: 24 }}>
      <AdminSidebar open={sidebarOpen} onToggle={()=> setSidebarOpen((v)=> !v)} />
      {!sidebarOpen && (
        <button
          onClick={()=> setSidebarOpen(true)}
          style={{ position: "fixed", left: 8, top: 12, zIndex: 1001, padding: "8px 10px", borderRadius: 8, border: "1px solid #2e2e37", background: "#23232b", color: "#fff", cursor: "pointer" }}
          title="Hiện menu"
        >
          ☰ Menu
        </button>
      )}
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}>
        <div className="logo-gradient" style={{ fontSize: 24, textAlign: "center" }}>Quản Lý Playlist Đặc Biệt</div>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "40px", color: "#b3b3b3" }}>
          <div style={{ fontSize: 18, marginBottom: 8 }}>Đang tải dữ liệu...</div>
          <div style={{ fontSize: 14 }}>Vui lòng chờ trong giây lát</div>
        </div>
      )}

      {!loading && (
        <div>
          <section style={{ background: "#1e1e24", border: "1px solid #2e2e37", borderRadius: 12, padding: 16 }}>
        <div className="recommend-header" style={{ marginBottom: 12 }}>
          <div className="recommend-title">Tạo playlist đặc biệt mới</div>
          <div style={{ color: "#b3b3b3", fontSize: 14, marginTop: 4 }}>
            Playlist này sẽ hiển thị trên trang chủ cho người dùng nghe
          </div>
        </div>
        {/* Form for playlist info only */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(200px,1fr))", gap: 16, alignItems: "end", marginBottom: 20 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Tên playlist *</span>
            <input 
              value={form.name} 
              onChange={(e)=> {
                setForm((f)=> ({...f, name: e.target.value}));
                if (error) setError(""); // Clear error when user starts typing
              }} 
              placeholder="Nhập tên playlist"
              required
              style={{ 
                padding: "10px 12px", 
                borderRadius: 8, 
                border: form.name.trim() ? "1px solid #444" : "1px solid #ff4444", 
                background: "#1f1f1f", 
                color: "#fff" 
              }} 
            />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Mô tả</span>
            <input 
              value={form.description} 
              onChange={(e)=> setForm((f)=> ({...f, description: e.target.value}))} 
              placeholder="Mô tả playlist"
              style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #444", background: "#1f1f1f", color: "#fff" }} 
            />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Công khai</span>
            <select value={form.isPublic} onChange={(e)=> setForm((f)=> ({...f, isPublic: e.target.value === "true"}))} style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #444", background: "#1f1f1f", color: "#fff" }}>
              <option value={true}>Công khai</option>
              <option value={false}>Riêng tư</option>
            </select>
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Cover</span>
            <input type="file" accept="image/*" onChange={(e)=> setForm((f)=> ({...f, cover: e.target.files?.[0] || null}))} />
          </label>
        </div>
        
        {/* Song Selection Section */}
        <div style={{ marginTop: 20, border: "1px solid #2e2e37", borderRadius: 12, padding: 16, background: "#1a1a20" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 style={{ color: "#fff", margin: 0, fontSize: 16 }}>Chọn bài hát cho playlist</h3>
              <div style={{ color: "#b3b3b3", fontSize: 14, marginTop: 4 }}>
                Đã chọn: {form.songs.length} bài hát
              </div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button 
                type="button"
                onClick={() => setForm((f) => ({ ...f, songs: [] }))}
                style={{ 
                  padding: "8px 16px", 
                  borderRadius: 6, 
                  border: "1px solid #444", 
                  background: "#2a2a2a", 
                  color: "#fff", 
                  cursor: "pointer",
                  fontSize: 14
                }}
              >
                Xóa tất cả
              </button>
              <button 
                type="button"
                onClick={createPlaylist}
                disabled={creating || !form.name.trim()} 
                style={{ 
                  padding: "10px 20px", 
                  borderRadius: 8, 
                  border: "1px solid #2e2e37", 
                  background: creating ? "#2a2a34" : (!form.name.trim() ? "#444" : "#1db954"), 
                  color: "#fff", 
                  cursor: (creating || !form.name.trim()) ? "not-allowed" : "pointer", 
                  fontWeight: 600,
                  fontSize: 14,
                  opacity: (creating || !form.name.trim()) ? 0.6 : 1
                }}
              >
                {creating ? "Đang tạo..." : "Tạo playlist"}
              </button>
            </div>
          </div>
          
          {/* Song Search and Selection */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Available Songs */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h4 style={{ color: "#fff", margin: 0, fontSize: 14 }}>Bài hát có sẵn</h4>
                <input
                  type="text"
                  placeholder="Tìm bài hát..."
                  value={songSearchQuery}
                  onChange={(e) => setSongSearchQuery(e.target.value)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: "1px solid #444",
                    background: "#1f1f1f",
                    color: "#fff",
                    fontSize: 13,
                    width: "200px"
                  }}
                />
              </div>
              <div style={{ 
                maxHeight: "300px", 
                overflowY: "auto", 
                border: "1px solid #2e2e37", 
                borderRadius: 8,
                background: "#1e1e24"
              }}>
                {filteredAvailableSongs.map((song) => (
                  <div 
                    key={song._id} 
                    style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center",
                      padding: "8px 12px", 
                      borderBottom: "1px solid #2a2a34",
                      cursor: "pointer",
                      transition: "background-color 0.2s ease"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#2a2a34"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    onClick={(e) => {
                      // Only add song if clicking on the div, not on the button
                      if (e.target.tagName !== 'BUTTON' && !form.songs.includes(song._id)) {
                        setForm((f) => ({ ...f, songs: [...f.songs, song._id] }));
                      }
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <img
                        src={withMediaBase(song.cover) || "/default-cover.png"}
                        alt={song.title}
                        style={{ width: 32, height: 32, borderRadius: 4, objectFit: "cover" }}
                      />
                      <div>
                        <div style={{ color: "#fff", fontSize: 13, fontWeight: 500 }}>{song.title}</div>
                        <div style={{ color: "#b3b3b3", fontSize: 12 }}>{song.artist}</div>
                      </div>
                    </div>
                    <button
                      style={{
                        padding: "4px 8px",
                        borderRadius: 4,
                        border: "1px solid #1db954",
                        background: form.songs.includes(song._id) ? "#1db954" : "transparent",
                        color: form.songs.includes(song._id) ? "#fff" : "#1db954",
                        cursor: "pointer",
                        fontSize: 12
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('Button + clicked for song:', song.title);
                        if (form.songs.includes(song._id)) {
                          console.log('Removing song from form');
                          setForm((f) => ({ ...f, songs: f.songs.filter(id => id !== song._id) }));
                        } else {
                          console.log('Adding song to form');
                          setForm((f) => ({ ...f, songs: [...f.songs, song._id] }));
                        }
                      }}
                    >
                      {form.songs.includes(song._id) ? "✓" : "+"}
                    </button>
                  </div>
                ))}
                {filteredAvailableSongs.length === 0 && (
                  <div style={{ padding: "20px", textAlign: "center", color: "#b3b3b3", fontSize: 14 }}>
                    Không tìm thấy bài hát
                  </div>
                )}
              </div>
            </div>
            
            {/* Selected Songs */}
            <div>
              <h4 style={{ color: "#fff", margin: "0 0 12px 0", fontSize: 14 }}>Bài hát đã chọn</h4>
              <div style={{ 
                maxHeight: "300px", 
                overflowY: "auto", 
                border: "1px solid #2e2e37", 
                borderRadius: 8,
                background: "#1e1e24"
              }}>
                {form.songs.length === 0 ? (
                  <div style={{ padding: "20px", textAlign: "center", color: "#b3b3b3", fontSize: 14 }}>
                    Chưa chọn bài hát nào
                  </div>
                ) : (
                  form.songs.map((songId) => {
                    const song = songs.find(s => s._id === songId);
                    if (!song) return null;
                    return (
                      <div 
                        key={songId} 
                        style={{ 
                          display: "flex", 
                          justifyContent: "space-between", 
                          alignItems: "center",
                          padding: "8px 12px", 
                          borderBottom: "1px solid #2a2a34"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <img
                            src={withMediaBase(song.cover) || "/default-cover.png"}
                            alt={song.title}
                            style={{ width: 32, height: 32, borderRadius: 4, objectFit: "cover" }}
                          />
                          <div>
                            <div style={{ color: "#fff", fontSize: 13, fontWeight: 500 }}>{song.title}</div>
                            <div style={{ color: "#b3b3b3", fontSize: 12 }}>{song.artist}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => setForm((f) => ({ ...f, songs: f.songs.filter(id => id !== songId) }))}
                          style={{
                            padding: "4px 8px",
                            borderRadius: 4,
                            border: "1px solid #ff4444",
                            background: "transparent",
                            color: "#ff4444",
                            cursor: "pointer",
                            fontSize: 12
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
          
          {error && (
            <div style={{ color: "#ff8080", fontSize: 14, marginTop: 12, textAlign: "center" }}>
              {error}
            </div>
          )}
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <div className="recommend-header" style={{ marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div className="recommend-title">Danh sách playlist đặc biệt</div>
            <div style={{ opacity: 0.8, fontSize: 14 }}>
              {loading ? "Đang tải..." : `${playlists.length} playlist`}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", maxWidth: "400px" }}>
            <input
              type="text"
              placeholder="Tìm kiếm playlist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                minWidth: "300px",
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #444",
                background: "#1f1f1f",
                color: "#fff",
                fontSize: "14px"
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: "1px solid #444",
                  background: "#2a2a2a",
                  color: "#b3b3b3",
                  cursor: "pointer",
                  fontSize: "12px"
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
        {searchQuery && (
          <div style={{ color: "#b3b3b3", fontSize: "12px", marginBottom: "8px", paddingLeft: "12px" }}>
            Tìm thấy {filteredPlaylists.length} playlist
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 0.8fr 0.6fr 0.8fr", gap: 8, padding: "8px 12px", borderBottom: "1px solid #2e2e37", background: "#1a1a20", color: "#b3b3b3" }}>
          <div>Tên playlist</div>
          <div>Mô tả</div>
          <div>Công khai</div>
          <div>Số bài</div>
          <div style={{ textAlign: "right" }}>Hành động</div>
        </div>

        {filteredPlaylists.map((pl) => (
          <PlaylistRow key={pl._id} playlist={pl} onSave={savePlaylist} onDelete={deletePlaylist} onCover={changeCover} onSelect={()=> { setSelectedPlaylistId(pl._id); setSongSearchQuery(""); }} selected={selectedPlaylistId === pl._id} />
        ))}
      </section>

      {selectedPlaylist && (
        <section style={{ marginTop: 24 }}>
          <div className="recommend-header" style={{ marginBottom: 16 }}>
            <div className="recommend-title">Quản lý bài hát: {selectedPlaylist.name}</div>
            <div style={{ color: "#b3b3b3", fontSize: 14, marginTop: 4 }}>
              {playlistSongs.length} bài hát trong playlist
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Bài hát trong playlist */}
            <div style={{ 
              border: "1px solid #2e2e37", 
              borderRadius: 16, 
              padding: 20, 
              background: "linear-gradient(135deg, #1e1e24 0%, #2a2a34 100%)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
            }}>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 8, 
                marginBottom: 16,
                paddingBottom: 12,
                borderBottom: "1px solid #3a3a44"
              }}>
                <div style={{ 
                  width: 4, 
                  height: 20, 
                  background: "linear-gradient(45deg, #1db954, #1ed760)", 
                  borderRadius: 2 
                }}></div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>Bài hát trong playlist</div>
                <div style={{ 
                  background: "#1db954", 
                  color: "#fff", 
                  padding: "2px 8px", 
                  borderRadius: 12, 
                  fontSize: 12, 
                  fontWeight: 600 
                }}>
                  {playlistSongs.length}
                </div>
              </div>
              
              {playlistSongs.length === 0 ? (
                <div style={{ 
                  textAlign: "center", 
                  padding: "40px 20px", 
                  color: "#b3b3b3",
                  fontSize: 14
                }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>🎵</div>
                  <div>Chưa có bài hát nào trong playlist</div>
                  <div style={{ fontSize: 12, marginTop: 4, opacity: 0.8 }}>Thêm bài hát từ danh sách bên phải</div>
                </div>
              ) : (
                <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                  {playlistSongs.map((s, index)=> (
                    <div key={s._id} style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 12, 
                      padding: "12px 0", 
                      borderBottom: index === playlistSongs.length - 1 ? "none" : "1px solid #2a2a34",
                      transition: "background-color 0.2s ease",
                      position: "relative"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#2a2a34"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ 
                          width: 24, 
                          height: 24, 
                          background: "linear-gradient(45deg, #1db954, #1ed760)", 
                          borderRadius: 12, 
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: 12,
                          fontWeight: 600,
                          boxShadow: "0 2px 4px rgba(29,185,84,0.3)"
                        }}>
                          {index + 1}
                        </div>
                        <img
                          src={withMediaBase(s.cover) || "/default-cover.png"}
                          alt={s.title}
                          style={{ 
                            width: 40, 
                            height: 40, 
                            borderRadius: 6, 
                            objectFit: "cover",
                            border: "1px solid #2a2a34"
                          }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          color: "#fff", 
                          fontSize: 14, 
                          fontWeight: 500,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis"
                        }}>
                          {s.title}
                        </div>
                        <div style={{ 
                          color: "#b3b3b3", 
                          fontSize: 12,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis"
                        }}>
                          {s.artist}
                        </div>
                      </div>
                      <button 
                        onClick={()=> removeSongFromPlaylist(selectedPlaylistId, s._id)} 
                        style={{ 
                          padding: "6px 12px", 
                          borderRadius: 8, 
                          border: "1px solid #ff4444", 
                          background: "linear-gradient(45deg, #ff4444, #ff6666)", 
                          color: "#fff", 
                          cursor: "pointer", 
                          fontSize: 12,
                          fontWeight: 500,
                          transition: "all 0.2s ease",
                          boxShadow: "0 2px 4px rgba(255,68,68,0.2)"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-1px)";
                          e.currentTarget.style.boxShadow = "0 4px 8px rgba(255,68,68,0.3)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "0 2px 4px rgba(255,68,68,0.2)";
                        }}
                      >
                        ✕ Gỡ
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Thêm bài hát có sẵn */}
            <div style={{ 
              border: "1px solid #2e2e37", 
              borderRadius: 16, 
              padding: 20, 
              background: "linear-gradient(135deg, #1e1e24 0%, #2a2a34 100%)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
            }}>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 8, 
                marginBottom: 16,
                paddingBottom: 12,
                borderBottom: "1px solid #3a3a44"
              }}>
                <div style={{ 
                  width: 4, 
                  height: 20, 
                  background: "linear-gradient(45deg, #1db954, #1ed760)", 
                  borderRadius: 2 
                }}></div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>Thêm bài hát có sẵn</div>
                <div style={{ 
                  background: "#1db954", 
                  color: "#fff", 
                  padding: "2px 8px", 
                  borderRadius: 12, 
                  fontSize: 12, 
                  fontWeight: 600 
                }}>
                  {filteredAvailableSongsForPlaylist.length}
                </div>
              </div>
              
              {/* Search bar */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ 
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}>
                  <input
                    type="text"
                    placeholder="🔍 Tìm bài hát..."
                    value={songSearchQuery}
                    onChange={(e) => setSongSearchQuery(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid #444",
                      background: "#1f1f1f",
                      color: "#fff",
                      fontSize: "14px",
                      transition: "border-color 0.2s ease"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#1db954"}
                    onBlur={(e) => e.target.style.borderColor = "#444"}
                  />
                  {songSearchQuery && (
                    <button
                      onClick={() => setSongSearchQuery("")}
                      style={{
                        padding: "8px",
                        borderRadius: 6,
                        border: "1px solid #444",
                        background: "#2a2a2a",
                        color: "#b3b3b3",
                        cursor: "pointer",
                        fontSize: "12px",
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#ff4444";
                        e.currentTarget.style.color = "#fff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#2a2a2a";
                        e.currentTarget.style.color = "#b3b3b3";
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
                {songSearchQuery && (
                  <div style={{ 
                    color: "#1db954", 
                    fontSize: "12px", 
                    marginTop: 8,
                    fontWeight: 500
                  }}>
                    Tìm thấy {filteredAvailableSongsForPlaylist.length} bài hát
                  </div>
                )}
              </div>
              
              {/* Song list */}
              {filteredAvailableSongsForPlaylist.length === 0 ? (
                <div style={{ 
                  textAlign: "center", 
                  padding: "40px 20px", 
                  color: "#b3b3b3",
                  fontSize: 14
                }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>🎵</div>
                  {songSearchQuery ? (
                    <>
                      <div>Không tìm thấy bài hát nào</div>
                      <div style={{ fontSize: 12, marginTop: 4, opacity: 0.8 }}>Thử từ khóa khác</div>
                    </>
                  ) : (
                    <>
                      <div>Tất cả bài hát đã được thêm</div>
                      <div style={{ fontSize: 12, marginTop: 4, opacity: 0.8 }}>Playlist đã đầy đủ</div>
                    </>
                  )}
                </div>
              ) : (
                <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                  {filteredAvailableSongsForPlaylist.map((s, index)=> (
                    <div key={s._id} style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 12, 
                      padding: "12px 0", 
                      borderBottom: index === filteredAvailableSongsForPlaylist.length - 1 ? "none" : "1px solid #2a2a34",
                      transition: "background-color 0.2s ease"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#2a2a34"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <img
                        src={withMediaBase(s.cover) || "/default-cover.png"}
                        alt={s.title}
                        style={{ 
                          width: 40, 
                          height: 40, 
                          borderRadius: 6, 
                          objectFit: "cover",
                          border: "1px solid #2a2a34"
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          color: "#fff", 
                          fontSize: 14, 
                          fontWeight: 500,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis"
                        }}>
                          {s.title}
                        </div>
                        <div style={{ 
                          color: "#b3b3b3", 
                          fontSize: 12,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis"
                        }}>
                          {s.artist}
                        </div>
                      </div>
                      <button 
                        onClick={()=> attachSongToPlaylist(selectedPlaylistId, s._id)} 
                        style={{ 
                          padding: "6px 12px", 
                          borderRadius: 8, 
                          border: "1px solid #1db954", 
                          background: "linear-gradient(45deg, #1db954, #1ed760)", 
                          color: "#fff", 
                          cursor: "pointer", 
                          fontSize: 12,
                          fontWeight: 500,
                          transition: "all 0.2s ease",
                          boxShadow: "0 2px 4px rgba(29,185,84,0.2)"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-1px)";
                          e.currentTarget.style.boxShadow = "0 4px 8px rgba(29,185,84,0.3)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "0 2px 4px rgba(29,185,84,0.2)";
                        }}
                      >
                        + Thêm
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}
        </div>
      )}
    </div>
  );
}

function PlaylistRow({ playlist, onSave, onDelete, onCover, onSelect, selected }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ 
    name: playlist.name, 
    description: playlist.description || "", 
    isPublic: playlist.isPublic || false
  });

  const save = async () => {
    try {
      setSaving(true);
      await onSave(playlist._id, { 
        name: form.name, 
        description: form.description,
        isPublic: form.isPublic
      });
      setEditing(false);
    } catch (e) {
      alert(e.message || String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 0.8fr 0.6fr 0.8fr", gap: 8, padding: "10px 12px", borderBottom: "1px solid #2e2e37", alignItems: "center", background: selected ? "#212129" : "transparent" }}>
      {editing ? (
        <input value={form.name} onChange={(e)=> setForm((f)=> ({...f, name: e.target.value}))} style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #444", background: "#1f1f1f", color: "#fff" }} />
      ) : (
        <div style={{ fontWeight: 600, cursor: "pointer" }} onClick={onSelect}>{playlist.name}</div>
      )}
      {editing ? (
        <input value={form.description} onChange={(e)=> setForm((f)=> ({...f, description: e.target.value}))} style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #444", background: "#1f1f1f", color: "#fff" }} />
      ) : (
        <div style={{ color: "#b3b3b3" }}>{playlist.description || "-"}</div>
      )}
      {editing ? (
        <select value={form.isPublic} onChange={(e)=> setForm((f)=> ({...f, isPublic: e.target.value === "true"}))} style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #444", background: "#1f1f1f", color: "#fff" }}>
          <option value={false}>Riêng tư</option>
          <option value={true}>Công khai</option>
        </select>
      ) : (
        <div style={{ color: "#b3b3b3" }}>
          {playlist.isPublic ? "Công khai" : "Riêng tư"}
        </div>
      )}
      <div>{playlist.songs?.length || 0}</div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        {editing ? (
          <>
            <label style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 12, color: "#b3b3b3" }}>Cover</span>
              <input type="file" accept="image/*" onChange={(e)=> onCover(playlist._id, e.target.files?.[0])} />
            </label>
            <button onClick={save} disabled={saving} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #2e2e37", background: "#1db954", color: "#fff", cursor: "pointer" }}>{saving ? "Đang lưu..." : "Lưu"}</button>
            <button onClick={()=> { setEditing(false); setForm({ name: playlist.name, description: playlist.description || "", isPublic: playlist.isPublic || false }); }} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #2e2e37", background: "#23232b", color: "#fff", cursor: "pointer" }}>Huỷ</button>
          </>
        ) : (
          <>
            <button onClick={()=> setEditing(true)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #2e2e37", background: "#23232b", color: "#fff", cursor: "pointer" }}>Sửa</button>
            <button onClick={()=> onDelete(playlist._id)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #632b2b", background: "#a33", color: "#fff", cursor: "pointer" }}>Xoá</button>
          </>
        )}
      </div>
    </div>
  );
}


export default PlaylistsAdmin;
