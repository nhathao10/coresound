import { useEffect, useState, useRef } from "react";
import AdminSidebar from "./AdminSidebar.jsx";

function Upload() {
  const [form, setForm] = useState({
    title: "",
    artist: "",
    premium: false,
    plays: "",
    genres: [],
    regionId: "",
  });
  const [coverFile, setCoverFile] = useState(null);
  const [songFile, setSongFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [songs, setSongs] = useState([]);
  const [loadingSongs, setLoadingSongs] = useState(true);
  const [genres, setGenres] = useState([]);
  const [loadingGenres, setLoadingGenres] = useState(true);
  const [regions, setRegions] = useState([]);
  const [loadingRegions, setLoadingRegions] = useState(true);

  useEffect(() => {
    document.title = "CoreSound";
    // load danh sách bài hát, thể loại và khu vực
    Promise.all([
      fetch("http://localhost:5000/api/songs").then((r) => r.json()),
      fetch("http://localhost:5000/api/genres").then((r) => r.json()),
      fetch("http://localhost:5000/api/regions").then((r) => r.json())
    ]).then(([songsData, genresData, regionsData]) => {
      setSongs(songsData);
      setGenres(genresData);
      setRegions(regionsData);
    }).catch(() => {})
    .finally(() => {
      setLoadingSongs(false);
      setLoadingGenres(false);
      setLoadingRegions(false);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!form.title || !form.artist || !coverFile || !songFile) {
      setError("Vui lòng nhập tiêu đề, nghệ sĩ và chọn cover + mp3");
      return;
    }
    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("artist", form.artist);
      if (form.premium) fd.append("premium", String(form.premium));
      if (form.plays !== "") fd.append("plays", String(form.plays));
      if (form.genres.length > 0) fd.append("genres", JSON.stringify(form.genres));
      if (form.regionId) fd.append("regionId", form.regionId);
      
      fd.append("cover", coverFile);
      fd.append("song", songFile);

      const res = await fetch("http://localhost:5000/api/songs/add", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload thất bại");
      setSuccess("Tải lên thành công!");
      
      // Tạo object song với đầy đủ thông tin genres và region
      const newSong = {
        ...data,
        genres: form.genres.map(genreId => {
          const genre = genres.find(g => g._id === genreId);
          return genre ? { _id: genre._id, name: genre.name } : { _id: genreId, name: "Unknown" };
        }),
        region: form.regionId ? { _id: form.regionId, name: regions.find(r => r._id === form.regionId)?.name } : null
      };
      
      setSongs((prev) => [newSong, ...prev]);
      setForm({ title: "", artist: "", premium: false, plays: "", genres: [], regionId: "" });
      setCoverFile(null);
      setSongFile(null);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setSubmitting(false);
    }
  };

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
        <div className="logo-gradient" style={{ fontSize: 24, textAlign: "center" }}>Quản Lý Bài Hát</div>
      </div>

      <form onSubmit={handleSubmit}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(250px, 1fr))",
          gap: 16,
          alignItems: "end",
          background: "#1e1e24",
          padding: 20,
          borderRadius: 12,
          border: "1px solid #2e2e37",
          width: "100%",
        }}
      >
        <label style={{ display: "grid", gap: 6 }}>
          <span>Tiêu đề</span>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Ví dụ: Open Arms"
            style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #444", background: "#1f1f1f", color: "#fff" }}
          />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Nghệ sĩ</span>
          <input
            value={form.artist}
            onChange={(e) => setForm((f) => ({ ...f, artist: e.target.value }))}
            placeholder="Ví dụ: SZA"
            style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #444", background: "#1f1f1f", color: "#fff" }}
          />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Lượt nghe (tuỳ chọn)</span>
          <input
            type="number"
            value={form.plays}
            onChange={(e) => setForm((f) => ({ ...f, plays: e.target.value }))}
            placeholder="0"
            min={0}
            style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #444", background: "#1f1f1f", color: "#fff" }}
          />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Thể loại (tuỳ chọn)</span>
          <MultiGenreSelector
            genres={genres}
            value={form.genres}
            onChange={(selectedGenres) => setForm((f) => ({ ...f, genres: selectedGenres }))}
            placeholder="Chọn thể loại"
          />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Khu vực (tuỳ chọn)</span>
          <RegionSelector
            regions={regions}
            value={form.regionId}
            onChange={(regionId) => setForm((f) => ({ ...f, regionId }))}
            placeholder="Chọn khu vực"
          />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Cover (ảnh)</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
            style={{ padding: 6, borderRadius: 8, border: "1px solid #444", background: "#1f1f1f", color: "#fff" }}
          />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span>File nhạc (mp3)</span>
          <input
            type="file"
            accept="audio/mpeg,audio/mp3"
            onChange={(e) => setSongFile(e.target.files?.[0] || null)}
            style={{ padding: 6, borderRadius: 8, border: "1px solid #444", background: "#1f1f1f", color: "#fff" }}
          />
        </label>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #2e2e37",
              background: submitting ? "#2a2a34" : "#1db954",
              color: "#fff",
              cursor: submitting ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            {submitting ? "Đang tải..." : "Tải lên"}
          </button>
          {error && <span style={{ color: "#ff8080" }}>{error}</span>}
          {success && <span style={{ color: "#80ffa6" }}>{success}</span>}
        </div>
      </form>

      <div style={{ marginTop: 24 }}>
        <div className="recommend-header" style={{ marginBottom: 8 }}>
          <div className="recommend-title">Danh sách bài hát</div>
          <div style={{ opacity: 0.8, fontSize: 14 }}>
            {loadingSongs ? "Đang tải..." : `${songs.length} bài`}
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1.5fr 1.2fr 1.5fr 1fr 0.7fr 0.6fr",
          gap: 8,
          color: "#b3b3b3",
          padding: "8px 12px",
          borderBottom: "1px solid #2e2e37",
          background: "#1a1a20"
        }}>
          <div>Tiêu đề</div>
          <div>Nghệ sĩ</div>
          <div>Thể loại</div>
          <div>Khu vực</div>
          <div>Lượt nghe</div>
          <div style={{ textAlign: "right" }}>Hành động</div>
        </div>

        {songs.map((s) => (
          <SongRow key={s._id} song={s} genres={genres} regions={regions} onChange={(next) => setSongs((prev) => prev.map((x) => x._id === next._id ? next : x))} onDelete={(id)=> setSongs((prev)=> prev.filter((x)=> x._id !== id))} />
        ))}
      </div>
    </div>
  );
}

function SongRow({ song, genres, regions, onChange, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ 
    title: song.title, 
    artist: song.artist, 
    plays: song.plays ?? 0, 
    premium: !!song.premium,
    genres: song.genres?.map(g => g._id || g) || [],
    region: song.region?._id || ""
  });
  const [newCover, setNewCover] = useState(null);
  const [newSong, setNewSong] = useState(null);

  // Cập nhật form khi song thay đổi
  useEffect(() => {
    setForm({ 
      title: song.title, 
      artist: song.artist, 
      plays: song.plays ?? 0, 
      premium: !!song.premium,
      genres: song.genres?.map(g => g._id || g) || [],
      region: song.region?._id || ""
    });
  }, [song]);

  const save = async () => {
    setSaving(true);
    try {
      const updateData = { 
        title: form.title, 
        artist: form.artist, 
        plays: form.plays, 
        premium: form.premium,
        genres: form.genres,
        region: form.region || null
      };
      const res = await fetch(`http://localhost:5000/api/songs/${song._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Cập nhật thất bại");
      let updated = data;
      if (newCover || newSong) {
        const fd = new FormData();
        if (newCover) fd.append("cover", newCover);
        if (newSong) fd.append("song", newSong);
        const res2 = await fetch(`http://localhost:5000/api/songs/${song._id}/files`, { method: "PATCH", body: fd });
        const data2 = await res2.json();
        if (!res2.ok) throw new Error(data2?.error || "Cập nhật file thất bại");
        updated = data2;
      }
      
      // Tạo object updated với đầy đủ thông tin genres và region
      const updatedSong = {
        ...updated,
        genres: updated.genres || (form.genres ? form.genres.map(genreId => {
          const genre = genres.find(g => g._id === genreId);
          return genre ? { _id: genre._id, name: genre.name } : { _id: genreId, name: "Unknown" };
        }) : []),
        region: form.region ? { _id: form.region, name: regions.find(r => r._id === form.region)?.name } : null
      };
      
      // Nếu backend không trả về genres, sử dụng genres từ form
      if (!updated.genres && form.genres && form.genres.length > 0) {
        updatedSong.genres = form.genres.map(genreId => {
          const genre = genres.find(g => g._id === genreId);
          return genre ? { _id: genre._id, name: genre.name } : { _id: genreId, name: "Unknown" };
        });
      }
      
      onChange(updatedSong);
      setEditing(false);
      setNewCover(null);
      setNewSong(null);
    } catch (e) {
      alert(e.message || String(e));
    } finally {
      setSaving(false);
    }
  };

  const removeSong = async () => {
    if (!confirm("Xoá bài hát này?")) return;
    const res = await fetch(`http://localhost:5000/api/songs/${song._id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) return alert(data?.error || "Xoá thất bại");
    onDelete(song._id);
  };

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1.5fr 1.2fr 1.5fr 1fr 0.7fr 0.6fr",
      gap: 8,
      padding: "10px 12px",
      borderBottom: "1px solid #2e2e37",
      alignItems: "center"
    }}>
      {editing ? (
        <input value={form.title} onChange={(e)=> setForm((f)=> ({...f, title: e.target.value}))} style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #444", background: "#1f1f1f", color: "#fff" }} />
      ) : (
        <div style={{ fontWeight: 600 }}>{song.title}</div>
      )}

      {editing ? (
        <input value={form.artist} onChange={(e)=> setForm((f)=> ({...f, artist: e.target.value}))} style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #444", background: "#1f1f1f", color: "#fff" }} />
      ) : (
        <div>{song.artist}</div>
      )}

      {editing ? (
        <MultiGenreSelector
          genres={genres}
          value={form.genres}
          onChange={(selectedGenres) => setForm((f) => ({ ...f, genres: selectedGenres }))}
          placeholder="Không có thể loại"
        />
      ) : (
        <div style={{ color: "#b3b3b3" }}>
          {song.genres?.length > 0 ? song.genres.map(g => g.name || g).join(", ") : "-"}
        </div>
      )}

      {editing ? (
        <RegionSelector
          regions={regions}
          value={form.region}
          onChange={(regionId) => setForm((f) => ({ ...f, region: regionId }))}
          placeholder="Không có khu vực"
        />
      ) : (
        <div style={{ color: "#b3b3b3" }}>{song.region?.name || "-"}</div>
      )}

      {editing ? (
        <input type="number" value={form.plays} onChange={(e)=> setForm((f)=> ({...f, plays: e.target.value}))} style={{ width: 120, padding: "6px 8px", borderRadius: 6, border: "1px solid #444", background: "#1f1f1f", color: "#fff" }} />
      ) : (
        <div>{Number(song.plays || 0).toLocaleString("vi-VN")}</div>
      )}

      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", alignItems: "center" }}>
        {editing ? (
          <>
            <div style={{ display: "flex", gap: 8 }}>
              <label style={{ display: "grid", gap: 4 }}>
                <span style={{ fontSize: 12, color: "#b3b3b3" }}>Cover</span>
                <input type="file" accept="image/*" onChange={(e)=> setNewCover(e.target.files?.[0] || null)} />
              </label>
              <label style={{ display: "grid", gap: 4 }}>
                <span style={{ fontSize: 12, color: "#b3b3b3" }}>MP3</span>
                <input type="file" accept="audio/mpeg,audio/mp3" onChange={(e)=> setNewSong(e.target.files?.[0] || null)} />
              </label>
            </div>
            <button onClick={save} disabled={saving} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #2e2e37", background: "#1db954", color: "#fff", cursor: "pointer" }}>{saving ? "Đang lưu..." : "Lưu"}</button>
            <button onClick={()=> { setEditing(false); setForm({ title: song.title, artist: song.artist, plays: song.plays ?? 0, premium: !!song.premium, genres: song.genres?.map(g => g._id || g) || [], region: song.region?._id || "" }); setNewCover(null); setNewSong(null); }} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #2e2e37", background: "#23232b", color: "#fff", cursor: "pointer" }}>Huỷ</button>
          </>
        ) : (
          <>
            <button onClick={()=> setEditing(true)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #2e2e37", background: "#23232b", color: "#fff", cursor: "pointer" }}>Sửa</button>
            <button onClick={removeSong} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #632b2b", background: "#a33", color: "#fff", cursor: "pointer" }}>Xoá</button>
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

// Component RegionSelector với dropdown có thể cuộn và tìm kiếm
function RegionSelector({ regions, value, onChange, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredRegions, setFilteredRegions] = useState(regions);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = regions.filter(region => 
        region.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredRegions(filtered);
    } else {
      setFilteredRegions(regions);
    }
  }, [searchTerm, regions]);

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

  const selectedRegion = regions.find(r => r._id === value);

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
        <span style={{ color: selectedRegion ? "#fff" : "#888" }}>
          {selectedRegion ? selectedRegion.name : placeholder}
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
          maxHeight: "200px",
          overflow: "hidden"
        }}>
          <input
            type="text"
            placeholder="Tìm kiếm khu vực..."
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
          <div style={{ maxHeight: "150px", overflowY: "auto" }}>
            <div
              onClick={() => {
                onChange("");
                setIsOpen(false);
                setSearchTerm("");
              }}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                color: "#888",
                borderBottom: "1px solid #333"
              }}
            >
              Không chọn khu vực
            </div>
            {filteredRegions.map((region) => (
              <div
                key={region._id}
                onClick={() => {
                  onChange(region._id);
                  setIsOpen(false);
                  setSearchTerm("");
                }}
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  color: "#fff",
                  borderBottom: "1px solid #333",
                  backgroundColor: value === region._id ? "#1db954" : "transparent"
                }}
                onMouseEnter={(e) => {
                  if (value !== region._id) {
                    e.target.style.backgroundColor = "#333";
                  }
                }}
                onMouseLeave={(e) => {
                  if (value !== region._id) {
                    e.target.style.backgroundColor = "transparent";
                  }
                }}
              >
                {region.name}
              </div>
            ))}
            {filteredRegions.length === 0 && (
              <div style={{
                padding: "8px 12px",
                color: "#888",
                textAlign: "center"
              }}>
                Không tìm thấy khu vực
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Upload;


