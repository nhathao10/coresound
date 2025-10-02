import { useEffect, useMemo, useState, useRef } from "react";
import AdminSidebar from "./AdminSidebar.jsx";

function AlbumsAdmin() {
  const [albums, setAlbums] = useState([]);
  const [songs, setSongs] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", artist: "", releaseDate: "", plays: "", cover: null, genres: [] });
  const [selectedAlbumId, setSelectedAlbumId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [songSearchQuery, setSongSearchQuery] = useState("");
  const selectedAlbum = useMemo(() => albums.find(a => a._id === selectedAlbumId) || null, [albums, selectedAlbumId]);

  useEffect(() => {
    document.title = "CoreSound";
    Promise.all([
      fetch("http://localhost:5000/api/albums").then(r=>r.json()),
      fetch("http://localhost:5000/api/songs").then(r=>r.json()),
      fetch("http://localhost:5000/api/genres").then(r=>r.json()),
    ]).then(([a, s, g]) => {
      setAlbums(a);
      setSongs(s);
      setGenres(g);
    }).catch((e)=> setError(e.message || String(e))).finally(()=> setLoading(false));
  }, []);

  const createAlbum = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.artist || !form.cover) {
      setError("Nhập tên, nghệ sĩ và chọn ảnh cover");
      return;
    }
    try {
      setCreating(true);
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("artist", form.artist);
      if (form.releaseDate) fd.append("releaseDate", form.releaseDate);
      if (form.plays !== "") fd.append("plays", String(form.plays));
      if (form.genres.length > 0) fd.append("genres", JSON.stringify(form.genres));
      fd.append("cover", form.cover);
      const res = await fetch("http://localhost:5000/api/albums", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Tạo album thất bại");
      
      // Tạo object album với đầy đủ thông tin genres
      const newAlbum = {
        ...data,
        genres: form.genres.map(genreId => {
          const genre = genres.find(g => g._id === genreId);
          return genre ? { _id: genre._id, name: genre.name } : { _id: genreId, name: "Unknown" };
        })
      };
      
      setAlbums((prev)=> [newAlbum, ...prev]);
      setForm({ name: "", artist: "", releaseDate: "", plays: "", cover: null, genres: [] });
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setCreating(false);
    }
  };

  const saveAlbum = async (albumId, patch) => {
    const res = await fetch(`http://localhost:5000/api/albums/${albumId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Cập nhật album thất bại");
    
    // Tạo object updated với đầy đủ thông tin genres
    const updatedAlbum = {
      ...data,
      genres: patch.genres ? patch.genres.map(genreId => {
        const genre = genres.find(g => g._id === genreId);
        return genre ? { _id: genre._id, name: genre.name } : { _id: genreId, name: "Unknown" };
      }) : data.genres
    };
    
    setAlbums((prev)=> prev.map((a)=> a._id === updatedAlbum._id ? updatedAlbum : a));
  };

  const deleteAlbum = async (albumId) => {
    if (!confirm("Xoá album này?")) return;
    const res = await fetch(`http://localhost:5000/api/albums/${albumId}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) return alert(data?.error || "Xoá thất bại");
    setAlbums((prev)=> prev.filter((a)=> a._id !== albumId));
    if (selectedAlbumId === albumId) setSelectedAlbumId("");
  };

  const changeCover = async (albumId, file) => {
    const fd = new FormData();
    fd.append("cover", file);
    const res = await fetch(`http://localhost:5000/api/albums/${albumId}`, { method: "PUT", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Cập nhật cover thất bại");
    setAlbums((prev)=> prev.map((a)=> a._id === data._id ? data : a));
  };

  const attachSongToAlbum = async (albumId, songId) => {
    // cập nhật bài hát để gán album
    const res = await fetch(`http://localhost:5000/api/songs/${songId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ album: albumId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Gán bài hát thất bại");
    // làm tươi danh sách bài hát
    setSongs((prev)=> prev.map((s)=> s._id === data._id ? data : s));
  };

  const removeSongFromAlbum = async (songId) => {
    const res = await fetch(`http://localhost:5000/api/songs/${songId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ album: null }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Gỡ bài hát thất bại");
    setSongs((prev)=> prev.map((s)=> s._id === data._id ? data : s));
  };

  const getAlbumId = (s) => {
    const a = s.album;
    if (!a) return "";
    return typeof a === "string" ? a : a._id;
  };
  const availableSongs = useMemo(
    () => songs.filter((s) => {
      const aid = getAlbumId(s);
      // Chỉ hiển thị những bài hát chưa thuộc album nào
      return !aid;
    }),
    [songs]
  );

  // Lọc bài hát có sẵn theo từ khóa tìm kiếm
  const filteredAvailableSongs = useMemo(() => {
    // Kiểm tra an toàn
    if (!availableSongs || !Array.isArray(availableSongs)) {
      return [];
    }
    
    if (!songSearchQuery.trim()) return availableSongs;
    
    const query = songSearchQuery.toLowerCase().trim();
    
    // Debug: Log first song structure
    if (availableSongs.length > 0 && songSearchQuery.length === 1) {
      console.log('Sample song structure:', availableSongs[0]);
    }
    
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
  }, [availableSongs, songSearchQuery]);
  const albumSongs = useMemo(
    () => songs.filter((s) => String(getAlbumId(s)) === String(selectedAlbumId)),
    [songs, selectedAlbumId]
  );

  // Lọc album theo từ khóa tìm kiếm
  const filteredAlbums = useMemo(() => {
    if (!searchQuery.trim()) return albums;
    
    const query = searchQuery.toLowerCase().trim();
    return albums.filter(album => {
      // Tìm kiếm theo tên album
      const matchName = album.name?.toLowerCase().includes(query);
      
      // Tìm kiếm theo nghệ sĩ
      const matchArtist = album.artist?.toLowerCase().includes(query);
      
      // Tìm kiếm theo thể loại
      const matchGenre = album.genres?.some(genre => 
        (genre.name || genre)?.toLowerCase().includes(query)
      );
      
      return matchName || matchArtist || matchGenre;
    });
  }, [albums, searchQuery]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
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
        <div className="logo-gradient" style={{ fontSize: 24, textAlign: "center" }}>Quản Lý Album</div>
      </div>

      <section style={{ background: "#1e1e24", border: "1px solid #2e2e37", borderRadius: 12, padding: 16 }}>
        <div className="recommend-header" style={{ marginBottom: 12 }}>
          <div className="recommend-title">Tạo album mới</div>
        </div>
        <form onSubmit={createAlbum} style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(180px,1fr))", gap: 12, alignItems: "end" }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Tên album</span>
            <input value={form.name} onChange={(e)=> setForm((f)=> ({...f, name: e.target.value}))} style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #444", background: "#1f1f1f", color: "#fff" }} />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Nghệ sĩ</span>
            <input value={form.artist} onChange={(e)=> setForm((f)=> ({...f, artist: e.target.value}))} style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #444", background: "#1f1f1f", color: "#fff" }} />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Ngày phát hành</span>
            <input type="date" value={form.releaseDate} onChange={(e)=> setForm((f)=> ({...f, releaseDate: e.target.value}))} style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #444", background: "#1f1f1f", color: "#fff" }} />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Lượt nghe (tuỳ chọn)</span>
            <input type="number" min={0} value={form.plays} onChange={(e)=> setForm((f)=> ({...f, plays: e.target.value}))} placeholder="0" style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #444", background: "#1f1f1f", color: "#fff" }} />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Thể loại</span>
            <MultiGenreSelector
              genres={genres}
              value={form.genres}
              onChange={(selectedGenres) => setForm((f) => ({ ...f, genres: selectedGenres }))}
              placeholder="Chọn thể loại"
            />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Cover</span>
            <input type="file" accept="image/*" onChange={(e)=> setForm((f)=> ({...f, cover: e.target.files?.[0] || null}))} />
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" disabled={creating} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #2e2e37", background: creating ? "#2a2a34" : "#1db954", color: "#fff", cursor: creating ? "not-allowed" : "pointer", fontWeight: 600 }}>
              {creating ? "Đang tạo..." : "Tạo album"}
            </button>
            {error && <span style={{ color: "#ff8080" }}>{error}</span>}
          </div>
        </form>
      </section>

      <section style={{ marginTop: 24 }}>
        <div className="recommend-header" style={{ marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div className="recommend-title">Danh sách album</div>
            <div style={{ opacity: 0.8, fontSize: 14 }}>
              {loading ? "Đang tải..." : `${albums.length} album`}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", maxWidth: "400px" }}>
            <input
              type="text"
              placeholder="Tìm kiếm album..."
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
            Tìm thấy {filteredAlbums.length} album
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 0.8fr 0.6fr 0.8fr", gap: 8, padding: "8px 12px", borderBottom: "1px solid #2e2e37", background: "#1a1a20", color: "#b3b3b3" }}>
          <div>Tên album</div>
          <div>Nghệ sĩ</div>
          <div>Thể loại</div>
          <div>Phát hành</div>
          <div>Lượt nghe</div>
          <div style={{ textAlign: "right" }}>Hành động</div>
        </div>

        {filteredAlbums.map((al) => (
          <AlbumRow key={al._id} album={al} genres={genres} onSave={saveAlbum} onDelete={deleteAlbum} onCover={changeCover} onSelect={()=> { setSelectedAlbumId(al._id); setSongSearchQuery(""); }} selected={selectedAlbumId === al._id} />
        ))}
      </section>

      {selectedAlbum && (
        <section style={{ marginTop: 24 }}>
          <div className="recommend-header" style={{ marginBottom: 8 }}>
            <div className="recommend-title">Thêm bài vào: {selectedAlbum.name}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ border: "1px solid #2e2e37", borderRadius: 12, padding: 12, background: "#1e1e24" }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Bài hát trong album</div>
              {albumSongs.length === 0 && <div style={{ opacity: 0.8 }}>Chưa có bài nào</div>}
              {albumSongs.map((s)=> (
                <div key={s._id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #2a2a34" }}>
                  <div>{s.title}</div>
                  <div style={{ color: "#b3b3b3" }}>{s.artist}</div>
                  <button onClick={()=> removeSongFromAlbum(s._id)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #632b2b", background: "#a33", color: "#fff", cursor: "pointer", justifySelf: "end" }}>Gỡ khỏi album</button>
                </div>
              ))}
            </div>
            <div style={{ border: "1px solid #2e2e37", borderRadius: 12, padding: 12, background: "#1e1e24" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontWeight: 700 }}>Thêm bài hát có sẵn</div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", maxWidth: "250px" }}>
                  <input
                    type="text"
                    placeholder="Tìm bài hát..."
                    value={songSearchQuery}
                    onChange={(e) => setSongSearchQuery(e.target.value)}
                    style={{
                      flex: 1,
                      minWidth: "200px",
                      padding: "6px 10px",
                      borderRadius: 6,
                      border: "1px solid #444",
                      background: "#1f1f1f",
                      color: "#fff",
                      fontSize: "13px"
                    }}
                  />
                  {songSearchQuery && (
                    <button
                      onClick={() => setSongSearchQuery("")}
                      style={{
                        padding: "6px 8px",
                        borderRadius: 4,
                        border: "1px solid #444",
                        background: "#2a2a2a",
                        color: "#b3b3b3",
                        cursor: "pointer",
                        fontSize: "11px"
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
              {songSearchQuery && (
                <div style={{ color: "#b3b3b3", fontSize: "11px", marginBottom: "8px" }}>
                  Tìm thấy {filteredAvailableSongs.length} bài hát
                </div>
              )}
              {filteredAvailableSongs.length === 0 && !songSearchQuery && <div style={{ opacity: 0.8 }}>Không còn bài nào để thêm</div>}
              {filteredAvailableSongs.length === 0 && songSearchQuery && <div style={{ opacity: 0.8 }}>Không tìm thấy bài hát nào</div>}
              {filteredAvailableSongs.map((s)=> (
                <div key={s._id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #2a2a34" }}>
                  <div>{s.title}</div>
                  <div style={{ color: "#b3b3b3" }}>{s.artist}</div>
                  <button onClick={()=> attachSongToAlbum(selectedAlbumId, s._id)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #2e2e37", background: "#23232b", color: "#fff", cursor: "pointer" }}>Thêm vào album</button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function AlbumRow({ album, genres, onSave, onDelete, onCover, onSelect, selected }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ 
    name: album.name, 
    artist: album.artist, 
    releaseDate: album.releaseDate ? new Date(album.releaseDate).toISOString().slice(0,10) : "", 
    plays: album.plays ?? 0,
    genres: album.genres?.map(g => g._id || g) || []
  });

  const save = async () => {
    try {
      setSaving(true);
      await onSave(album._id, { 
        name: form.name, 
        artist: form.artist, 
        ...(form.releaseDate ? { releaseDate: form.releaseDate } : {}), 
        plays: form.plays,
        genres: form.genres
      });
      setEditing(false);
    } catch (e) {
      alert(e.message || String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 0.8fr 0.6fr 0.8fr", gap: 8, padding: "10px 12px", borderBottom: "1px solid #2e2e37", alignItems: "center", background: selected ? "#212129" : "transparent" }}>
      {editing ? (
        <input value={form.name} onChange={(e)=> setForm((f)=> ({...f, name: e.target.value}))} style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #444", background: "#1f1f1f", color: "#fff" }} />
      ) : (
        <div style={{ fontWeight: 600, cursor: "pointer" }} onClick={onSelect}>{album.name}</div>
      )}
      {editing ? (
        <input value={form.artist} onChange={(e)=> setForm((f)=> ({...f, artist: e.target.value}))} style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #444", background: "#1f1f1f", color: "#fff" }} />
      ) : (
        <div>{album.artist}</div>
      )}
      {editing ? (
        <MultiGenreSelector
          genres={genres}
          value={form.genres}
          onChange={(selectedGenres) => setForm((f) => ({ ...f, genres: selectedGenres }))}
          placeholder="Chọn thể loại"
        />
      ) : (
        <div style={{ color: "#b3b3b3" }}>
          {album.genres?.length > 0 ? album.genres.map(g => g.name || g).join(", ") : "-"}
        </div>
      )}
      {editing ? (
        <input type="date" value={form.releaseDate} onChange={(e)=> setForm((f)=> ({...f, releaseDate: e.target.value}))} style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #444", background: "#1f1f1f", color: "#fff" }} />
      ) : (
        <div>{album.releaseDate ? new Date(album.releaseDate).toLocaleDateString("vi-VN") : ""}</div>
      )}
      {editing ? (
        <input type="number" min={0} value={form.plays} onChange={(e)=> setForm((f)=> ({...f, plays: Number(e.target.value) }))} style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #444", background: "#1f1f1f", color: "#fff", width: 120 }} />
      ) : (
        <div>{Number(album.plays || 0).toLocaleString("vi-VN")}</div>
      )}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        {editing ? (
          <>
            <label style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 12, color: "#b3b3b3" }}>Cover</span>
              <input type="file" accept="image/*" onChange={(e)=> onCover(album._id, e.target.files?.[0])} />
            </label>
            <button onClick={save} disabled={saving} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #2e2e37", background: "#1db954", color: "#fff", cursor: "pointer" }}>{saving ? "Đang lưu..." : "Lưu"}</button>
            <button onClick={()=> { setEditing(false); setForm({ name: album.name, artist: album.artist, releaseDate: album.releaseDate ? new Date(album.releaseDate).toISOString().slice(0,10) : "", plays: album.plays ?? 0, genres: album.genres?.map(g => g._id || g) || [] }); }} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #2e2e37", background: "#23232b", color: "#fff", cursor: "pointer" }}>Huỷ</button>
          </>
        ) : (
          <>
            <button onClick={()=> setEditing(true)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #2e2e37", background: "#23232b", color: "#fff", cursor: "pointer" }}>Sửa</button>
            <button onClick={()=> onDelete(album._id)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #632b2b", background: "#a33", color: "#fff", cursor: "pointer" }}>Xoá</button>
          </>
        )}
      </div>
    </div>
  );
}

// Component MultiGenreSelector cho việc chọn nhiều thể loại
function MultiGenreSelector({ genres, value, onChange, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredGenres, setFilteredGenres] = useState(genres);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = genres.filter(genre => 
        genre.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredGenres(filtered);
    } else {
      setFilteredGenres(genres);
    }
  }, [searchTerm, genres]);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedGenres = genres.filter(g => value.includes(g._id));
  const selectedNames = selectedGenres.map(g => g.name);

  const toggleGenre = (genreId) => {
    if (value.includes(genreId)) {
      onChange(value.filter(id => id !== genreId));
    } else {
      onChange([...value, genreId]);
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: "10px 12px",
          borderRadius: 8,
          border: "1px solid #444",
          background: "#1f1f1f",
          color: "#fff",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          minHeight: "20px"
        }}
      >
        <span style={{ color: selectedNames.length > 0 ? "#fff" : "#888" }}>
          {selectedNames.length > 0 
            ? selectedNames.length === 1 
              ? selectedNames[0]
              : `${selectedNames.length} thể loại đã chọn`
            : placeholder
          }
        </span>
        <span style={{ color: "#888" }}>{isOpen ? "▲" : "▼"}</span>
      </div>
      
      {isOpen && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          background: "#1f1f1f",
          border: "1px solid #444",
          borderRadius: 8,
          marginTop: 4,
          zIndex: 1000,
          maxHeight: "250px",
          overflow: "hidden"
        }}>
          <input
            type="text"
            placeholder="Tìm kiếm thể loại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "none",
              background: "#2a2a2a",
              color: "#fff",
              outline: "none",
              borderBottom: "1px solid #444"
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <div style={{ maxHeight: "200px", overflowY: "auto" }}>
            {filteredGenres.map((genre) => (
              <div
                key={genre._id}
                onClick={() => toggleGenre(genre._id)}
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  color: "#fff",
                  borderBottom: "1px solid #333",
                  backgroundColor: value.includes(genre._id) ? "#1db954" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
                onMouseEnter={(e) => {
                  if (!value.includes(genre._id)) {
                    e.target.style.backgroundColor = "#333";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!value.includes(genre._id)) {
                    e.target.style.backgroundColor = "transparent";
                  }
                }}
              >
                <input
                  type="checkbox"
                  checked={value.includes(genre._id)}
                  onChange={() => {}} // Handled by parent div onClick
                  style={{ margin: 0 }}
                />
                {genre.name}
              </div>
            ))}
            {filteredGenres.length === 0 && (
              <div style={{
                padding: "8px 12px",
                color: "#888",
                textAlign: "center"
              }}>
                Không tìm thấy thể loại
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AlbumsAdmin;


