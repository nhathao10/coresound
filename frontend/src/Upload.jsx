import { useEffect, useState } from "react";

function Upload() {
  const [form, setForm] = useState({
    title: "",
    artist: "",
    premium: false,
    plays: "",
    
  });
  const [coverFile, setCoverFile] = useState(null);
  const [songFile, setSongFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [songs, setSongs] = useState([]);
  const [loadingSongs, setLoadingSongs] = useState(true);

  useEffect(() => {
    document.title = "CoreSound";
    // load danh sách bài hát
    fetch("http://localhost:5000/api/songs")
      .then((r) => r.json())
      .then((data) => setSongs(data))
      .catch(() => {})
      .finally(() => setLoadingSongs(false));
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
      
      fd.append("cover", coverFile);
      fd.append("song", songFile);

      const res = await fetch("http://localhost:5000/api/songs/add", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload thất bại");
      setSuccess("Tải lên thành công!");
      setSongs((prev) => [data, ...prev]);
      setForm({ title: "", artist: "", premium: false, plays: "" });
      setCoverFile(null);
      setSongFile(null);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="music-app dark-theme" style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <a href="#/" style={{ textDecoration: "none", color: "#1db954", fontWeight: 700 }}>&larr; Quay về trang chính</a>
        <div className="logo-gradient" style={{ fontSize: 24 }}>CoreSound • Upload</div>
        <div />
      </div>

      <form onSubmit={handleSubmit}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, minmax(220px, 1fr))",
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
          gridTemplateColumns: "1.5fr 1.2fr 0.7fr 0.6fr",
          gap: 8,
          color: "#b3b3b3",
          padding: "8px 12px",
          borderBottom: "1px solid #2e2e37",
          background: "#1a1a20"
        }}>
          <div>Tiêu đề</div>
          <div>Nghệ sĩ</div>
          <div>Lượt nghe</div>
          <div style={{ textAlign: "right" }}>Hành động</div>
        </div>

        {songs.map((s) => (
          <SongRow key={s._id} song={s} onChange={(next) => setSongs((prev) => prev.map((x) => x._id === next._id ? next : x))} onDelete={(id)=> setSongs((prev)=> prev.filter((x)=> x._id !== id))} />
        ))}
      </div>
    </div>
  );
}

function SongRow({ song, onChange, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: song.title, artist: song.artist, plays: song.plays ?? 0, premium: !!song.premium });
  const [newCover, setNewCover] = useState(null);
  const [newSong, setNewSong] = useState(null);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`http://localhost:5000/api/songs/${song._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title, artist: form.artist, plays: form.plays, premium: form.premium }),
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
      onChange(updated);
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
      gridTemplateColumns: "1.5fr 1.2fr 0.7fr 0.6fr",
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
            <button onClick={()=> { setEditing(false); setForm({ title: song.title, artist: song.artist, plays: song.plays ?? 0, premium: !!song.premium }); }} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #2e2e37", background: "#23232b", color: "#fff", cursor: "pointer" }}>Huỷ</button>
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

export default Upload;


