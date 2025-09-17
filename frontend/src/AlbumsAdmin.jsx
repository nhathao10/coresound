import { useEffect, useMemo, useState } from "react";

function Sidebar({ open, onToggle }) {
  const hash = typeof window !== "undefined" ? window.location.hash : "#/";
  const linkStyle = (active) => ({
    display: "block",
    padding: "10px 12px",
    borderRadius: 8,
    color: active ? "#1db954" : "#e5e5e5",
    background: active ? "#1f2a1f" : "transparent",
    textDecoration: "none",
    fontWeight: active ? 700 : 500,
  });
  return (
    <aside style={{ position: "fixed", left: open ? 0 : -240, top: 0, bottom: 0, width: 220, background: "#151518", borderRight: "1px solid #23232b", padding: 16, transition: "left 0.2s ease" }}>
      <div className="logo-gradient" style={{ fontSize: 22, marginBottom: 12 }}>CoreSound Admin</div>
      <nav style={{ display: "grid", gap: 6 }}>
        <a href="#/" style={linkStyle(hash === "#/" || hash === "#/")}>Trang chủ</a>
        <a href="#/upload" style={linkStyle(hash.startsWith("#/upload"))}>Quản lý Bài hát</a>
        <a href="#/albums-admin" style={linkStyle(hash.startsWith("#/albums-admin"))}>Quản lý Album</a>
      </nav>
      <button onClick={onToggle} style={{ marginTop: 16, padding: "8px 10px", borderRadius: 8, border: "1px solid #2e2e37", background: "#23232b", color: "#fff", cursor: "pointer", width: "100%" }}>{open ? "Ẩn menu" : "Hiện menu"}</button>
    </aside>
  );
}

function AlbumsAdmin() {
  const [albums, setAlbums] = useState([]);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", artist: "", releaseDate: "", plays: "", cover: null });
  const [selectedAlbumId, setSelectedAlbumId] = useState("");
  const selectedAlbum = useMemo(() => albums.find(a => a._id === selectedAlbumId) || null, [albums, selectedAlbumId]);

  useEffect(() => {
    document.title = "CoreSound • Albums Admin";
    Promise.all([
      fetch("http://localhost:5000/api/albums").then(r=>r.json()),
      fetch("http://localhost:5000/api/songs").then(r=>r.json()),
    ]).then(([a, s]) => {
      setAlbums(a);
      setSongs(s);
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
      fd.append("cover", form.cover);
      const res = await fetch("http://localhost:5000/api/albums", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Tạo album thất bại");
      setAlbums((prev)=> [data, ...prev]);
      setForm({ name: "", artist: "", releaseDate: "", plays: "", cover: null });
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
    setAlbums((prev)=> prev.map((a)=> a._id === data._id ? data : a));
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
      return !aid || String(aid) !== String(selectedAlbumId);
    }),
    [songs, selectedAlbumId]
  );
  const albumSongs = useMemo(
    () => songs.filter((s) => String(getAlbumId(s)) === String(selectedAlbumId)),
    [songs, selectedAlbumId]
  );

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const contentOffset = sidebarOpen ? 220 : 0;
  return (
    <div className="music-app dark-theme" style={{ padding: 24 }}>
      <Sidebar open={sidebarOpen} onToggle={()=> setSidebarOpen((v)=> !v)} />
      {!sidebarOpen && (
        <button
          onClick={()=> setSidebarOpen(true)}
          style={{ position: "fixed", left: 8, top: 12, zIndex: 1000, padding: "8px 10px", borderRadius: 8, border: "1px solid #2e2e37", background: "#23232b", color: "#fff", cursor: "pointer" }}
          title="Hiện menu"
        >
          ☰ Menu
        </button>
      )}
      <div style={{ marginLeft: contentOffset, marginBottom: 16, display: "flex", justifyContent: "center" }}>
        <div className="logo-gradient" style={{ fontSize: 24, textAlign: "center" }}>Quản Lý Album</div>
      </div>

      <section style={{ background: "#1e1e24", border: "1px solid #2e2e37", borderRadius: 12, padding: 16, marginLeft: contentOffset }}>
        <div className="recommend-header" style={{ marginBottom: 12 }}>
          <div className="recommend-title">Tạo album mới</div>
        </div>
        <form onSubmit={createAlbum} style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(200px,1fr))", gap: 12, alignItems: "end" }}>
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

      <section style={{ marginTop: 24, marginLeft: contentOffset }}>
        <div className="recommend-header" style={{ marginBottom: 8 }}>
          <div className="recommend-title">Danh sách album</div>
          <div style={{ opacity: 0.8, fontSize: 14 }}>{loading ? "Đang tải..." : `${albums.length} album`}</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 0.8fr 0.6fr 0.8fr", gap: 8, padding: "8px 12px", borderBottom: "1px solid #2e2e37", background: "#1a1a20", color: "#b3b3b3" }}>
          <div>Tên album</div>
          <div>Nghệ sĩ</div>
          <div>Phát hành</div>
          <div>Lượt nghe</div>
          <div style={{ textAlign: "right" }}>Hành động</div>
        </div>

        {albums.map((al) => (
          <AlbumRow key={al._id} album={al} onSave={saveAlbum} onDelete={deleteAlbum} onCover={changeCover} onSelect={()=> setSelectedAlbumId(al._id)} selected={selectedAlbumId === al._id} />
        ))}
      </section>

      {selectedAlbum && (
        <section style={{ marginTop: 24, marginLeft: contentOffset }}>
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
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Thêm bài hát có sẵn</div>
              {availableSongs.length === 0 && <div style={{ opacity: 0.8 }}>Không còn bài nào để thêm</div>}
              {availableSongs.map((s)=> (
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

function AlbumRow({ album, onSave, onDelete, onCover, onSelect, selected }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: album.name, artist: album.artist, releaseDate: album.releaseDate ? new Date(album.releaseDate).toISOString().slice(0,10) : "", plays: album.plays ?? 0 });

  const save = async () => {
    try {
      setSaving(true);
      await onSave(album._id, { name: form.name, artist: form.artist, ...(form.releaseDate ? { releaseDate: form.releaseDate } : {}), plays: form.plays });
      setEditing(false);
    } catch (e) {
      alert(e.message || String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 0.8fr 0.6fr 0.8fr", gap: 8, padding: "10px 12px", borderBottom: "1px solid #2e2e37", alignItems: "center", background: selected ? "#212129" : "transparent" }}>
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
            <button onClick={()=> setEditing(false)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #2e2e37", background: "#23232b", color: "#fff", cursor: "pointer" }}>Huỷ</button>
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

export default AlbumsAdmin;


