import { useEffect, useState } from "react";
import AdminSidebar from "./AdminSidebar.jsx";

function GenresAdmin() {
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
  });
  const [coverFile, setCoverFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [genres, setGenres] = useState([]);
  const [loadingGenres, setLoadingGenres] = useState(true);

  useEffect(() => {
    document.title = "CoreSound - Quản lý Thể loại";
    // load danh sách thể loại
    fetch("http://localhost:5000/api/genres")
      .then((r) => r.json())
      .then((data) => setGenres(data))
      .catch(() => {})
      .finally(() => setLoadingGenres(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!form.name) {
      setError("Vui lòng nhập tên thể loại");
      return;
    }
    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append("name", form.name);
      if (form.slug) fd.append("slug", form.slug);
      if (form.description) fd.append("description", form.description);
      if (coverFile) fd.append("cover", coverFile);

      const res = await fetch("http://localhost:5000/api/genres", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Thêm thể loại thất bại");
      setSuccess("Thêm thể loại thành công!");
      setGenres((prev) => [data, ...prev]);
      setForm({ name: "", slug: "", description: "" });
      setCoverFile(null);
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
        <div className="logo-gradient" style={{ fontSize: 24, textAlign: "center" }}>Quản Lý Thể Loại Nhạc</div>
      </div>

      <form onSubmit={handleSubmit}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(200px, 1fr))",
          gap: 12,
          alignItems: "end",
          background: "#1e1e24",
          padding: 16,
          borderRadius: 12,
          border: "1px solid #2e2e37",
          width: "100%",
        }}
      >
        <label style={{ display: "grid", gap: 6 }}>
          <span>Tên thể loại *</span>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Ví dụ: Pop, Rock, Hip-Hop"
            style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #444", background: "#1f1f1f", color: "#fff" }}
          />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Slug (tuỳ chọn)</span>
          <input
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            placeholder="Ví dụ: pop-music"
            style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #444", background: "#1f1f1f", color: "#fff" }}
          />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Mô tả (tuỳ chọn)</span>
          <input
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Mô tả về thể loại nhạc"
            style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #444", background: "#1f1f1f", color: "#fff" }}
          />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Ảnh bìa (tuỳ chọn)</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
            style={{ padding: 6, borderRadius: 8, border: "1px solid #444", background: "#1f1f1f", color: "#fff" }}
          />
        </label>
        <div style={{ display: "flex", gap: 8, alignItems: "center", gridColumn: "1 / -1" }}>
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
            {submitting ? "Đang thêm..." : "Thêm thể loại"}
          </button>
          {error && <span style={{ color: "#ff8080" }}>{error}</span>}
          {success && <span style={{ color: "#80ffa6" }}>{success}</span>}
        </div>
      </form>

      <div style={{ marginTop: 24 }}>
        <div className="recommend-header" style={{ marginBottom: 8 }}>
          <div className="recommend-title">Danh sách thể loại</div>
          <div style={{ opacity: 0.8, fontSize: 14 }}>
            {loadingGenres ? "Đang tải..." : `${genres.length} thể loại`}
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr 0.6fr",
          gap: 8,
          color: "#b3b3b3",
          padding: "8px 12px",
          borderBottom: "1px solid #2e2e37",
          background: "#1a1a20"
        }}>
          <div>Tên thể loại</div>
          <div>Slug</div>
          <div>Mô tả</div>
          <div style={{ textAlign: "right" }}>Hành động</div>
        </div>

        {genres.map((genre) => (
          <GenreRow key={genre._id} genre={genre} onChange={(next) => setGenres((prev) => prev.map((x) => x._id === next._id ? next : x))} onDelete={(id)=> setGenres((prev)=> prev.filter((x)=> x._id !== id))} />
        ))}
      </div>
    </div>
  );
}

function GenreRow({ genre, onChange, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ 
    name: genre.name, 
    slug: genre.slug || "", 
    description: genre.description || "" 
  });
  const [newCover, setNewCover] = useState(null);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`http://localhost:5000/api/genres/${genre._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: form.name, 
          slug: form.slug, 
          description: form.description 
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Cập nhật thất bại");
      let updated = data;
      if (newCover) {
        const fd = new FormData();
        fd.append("cover", newCover);
        const res2 = await fetch(`http://localhost:5000/api/genres/${genre._id}/cover`, { method: "PATCH", body: fd });
        const data2 = await res2.json();
        if (!res2.ok) throw new Error(data2?.error || "Cập nhật ảnh bìa thất bại");
        updated = data2;
      }
      onChange(updated);
      setEditing(false);
      setNewCover(null);
    } catch (e) {
      alert(e.message || String(e));
    } finally {
      setSaving(false);
    }
  };

  const removeGenre = async () => {
    if (!confirm("Xoá thể loại này? Tất cả bài hát và album liên quan sẽ bị ảnh hưởng.")) return;
    const res = await fetch(`http://localhost:5000/api/genres/${genre._id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) return alert(data?.error || "Xoá thất bại");
    onDelete(genre._id);
  };

  const withMediaBase = (p) => (p && p.startsWith("/uploads") ? `http://localhost:5000${p}` : p);

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "2fr 1fr 1fr 0.6fr",
      gap: 8,
      padding: "10px 12px",
      borderBottom: "1px solid #2e2e37",
      alignItems: "center"
    }}>
      {editing ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input 
            value={form.name} 
            onChange={(e)=> setForm((f)=> ({...f, name: e.target.value}))} 
            style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #444", background: "#1f1f1f", color: "#fff", flex: 1 }} 
          />
          {genre.cover && (
            <img 
              src={withMediaBase(genre.cover)} 
              alt={genre.name}
              style={{ width: 32, height: 32, borderRadius: 4, objectFit: "cover" }}
            />
          )}
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontWeight: 600 }}>{genre.name}</div>
          {genre.cover && (
            <img 
              src={withMediaBase(genre.cover)} 
              alt={genre.name}
              style={{ width: 32, height: 32, borderRadius: 4, objectFit: "cover" }}
            />
          )}
        </div>
      )}

      {editing ? (
        <input 
          value={form.slug} 
          onChange={(e)=> setForm((f)=> ({...f, slug: e.target.value}))} 
          style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #444", background: "#1f1f1f", color: "#fff" }} 
        />
      ) : (
        <div style={{ color: "#b3b3b3" }}>{genre.slug || "-"}</div>
      )}

      {editing ? (
        <input 
          value={form.description} 
          onChange={(e)=> setForm((f)=> ({...f, description: e.target.value}))} 
          style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #444", background: "#1f1f1f", color: "#fff" }} 
        />
      ) : (
        <div style={{ color: "#b3b3b3" }}>{genre.description || "-"}</div>
      )}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center" }}>
        {editing ? (
          <>
            <label style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 12, color: "#b3b3b3" }}>Ảnh bìa</span>
              <input type="file" accept="image/*" onChange={(e)=> setNewCover(e.target.files?.[0] || null)} />
            </label>
            <button onClick={save} disabled={saving} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #2e2e37", background: "#1db954", color: "#fff", cursor: "pointer" }}>{saving ? "Đang lưu..." : "Lưu"}</button>
            <button onClick={()=> { setEditing(false); setForm({ name: genre.name, slug: genre.slug || "", description: genre.description || "" }); }} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #2e2e37", background: "#23232b", color: "#fff", cursor: "pointer" }}>Huỷ</button>
          </>
        ) : (
          <>
            <button onClick={()=> setEditing(true)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #2e2e37", background: "#23232b", color: "#fff", cursor: "pointer" }}>Sửa</button>
            <button onClick={removeGenre} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #632b2b", background: "#a33", color: "#fff", cursor: "pointer" }}>Xoá</button>
          </>
        )}
      </div>
    </div>
  );
}

export default GenresAdmin;
