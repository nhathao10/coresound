import { useEffect, useState, useRef } from "react";
import AdminSidebar from "./AdminSidebar.jsx";
import "./App.css";

function ArtistsAdmin() {
  const [form, setForm] = useState({
    name: "",
    bio: "",
    genres: [],
    country: "",
    debutYear: "",
    followers: "",
    monthlyListeners: "",
    isVerified: false,
    socialLinks: {
      website: "",
      instagram: "",
      twitter: "",
      facebook: "",
      youtube: ""
    }
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [artists, setArtists] = useState([]);
  const [loadingArtists, setLoadingArtists] = useState(true);
  const [genres, setGenres] = useState([]);
  const [loadingGenres, setLoadingGenres] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingArtist, setEditingArtist] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const withMediaBase = (p) => (p && p.startsWith("/uploads") ? `${import.meta.env.VITE_API_URL}${p}` : p);

  useEffect(() => {
    document.title = "Quản lý nghệ sĩ - CoreSound";
    // Load danh sách nghệ sĩ và thể loại
    Promise.all([
      fetch(`${import.meta.env.VITE_API_URL}/api/artists`).then((r) => r.json()),
      fetch(`${import.meta.env.VITE_API_URL}/api/genres`).then((r) => r.json())
    ]).then(([artistsData, genresData]) => {
      setArtists(artistsData);
      setGenres(genresData);
    }).catch(() => {})
    .finally(() => {
      setLoadingArtists(false);
      setLoadingGenres(false);
    });
  }, []);

  // Filter artists based on search query
  const filteredArtists = artists.filter(artist => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      artist.name.toLowerCase().includes(query) ||
      (artist.bio && artist.bio.toLowerCase().includes(query)) ||
      (artist.country && artist.country.toLowerCase().includes(query)) ||
      (artist.genres && artist.genres.some(genre => 
        genre && genre.name && genre.name.toLowerCase().includes(query)))
    );
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!form.name) {
      setError("Vui lòng nhập tên nghệ sĩ");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("bio", form.bio);
      formData.append("genres", JSON.stringify(form.genres));
      formData.append("country", form.country);
      formData.append("debutYear", form.debutYear);
      formData.append("followers", form.followers);
      formData.append("monthlyListeners", form.monthlyListeners);
      formData.append("isVerified", form.isVerified);
      formData.append("socialLinks", JSON.stringify(form.socialLinks));

      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const url = editingArtist 
        ? `${import.meta.env.VITE_API_URL}/api/artists/${editingArtist._id}`
        : `${import.meta.env.VITE_API_URL}/api/artists`;
      
      const method = editingArtist ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        body: formData,
      });

      if (response.ok) {
        const newArtist = await response.json();
        if (editingArtist) {
          setArtists(prev => prev.map(a => a._id === editingArtist._id ? newArtist : a));
          setSuccess("Cập nhật nghệ sĩ thành công!");
        } else {
          setArtists(prev => [newArtist, ...prev]);
          setSuccess("Thêm nghệ sĩ thành công!");
        }
        resetForm();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Có lỗi xảy ra");
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi thêm nghệ sĩ");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      bio: "",
      genres: [],
      country: "",
      debutYear: "",
      followers: "",
      monthlyListeners: "",
      isVerified: false,
      socialLinks: {
        website: "",
        instagram: "",
        twitter: "",
        facebook: "",
        youtube: ""
      }
    });
    setAvatarFile(null);
    setEditingArtist(null);
  };

  const handleEdit = (artist) => {
    setForm({
      name: artist.name,
      bio: artist.bio || "",
      genres: artist.genres ? artist.genres.map(g => g._id) : [],
      country: artist.country || "",
      debutYear: artist.debutYear || "",
      followers: artist.followers || "",
      monthlyListeners: artist.monthlyListeners || "",
      isVerified: artist.isVerified || false,
      socialLinks: artist.socialLinks || {
        website: "",
        instagram: "",
        twitter: "",
        facebook: "",
        youtube: ""
      }
    });
    setEditingArtist(artist);
    setError("");
    setSuccess("");
  };

  const handleDelete = async (id) => {
    if (!confirm("Bạn có chắc chắn muốn xóa nghệ sĩ này?")) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/artists/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setArtists(prev => prev.filter(a => a._id !== id));
        setSuccess("Xóa nghệ sĩ thành công!");
      } else {
        setError("Có lỗi xảy ra khi xóa nghệ sĩ");
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi xóa nghệ sĩ");
    }
  };

  return (
    <div className="music-app dark-theme" style={{ padding: 24 }}>
      <AdminSidebar open={sidebarOpen} onToggle={()=> setSidebarOpen((v)=> !v)} />
      {!sidebarOpen && (
        <button
          onClick={()=> setSidebarOpen(true)}
          style={{
            position: "fixed",
            top: 20,
            left: 20,
            zIndex: 1000,
            background: "#1db954",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 12px",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600
          }}
        >
          ☰ Menu
        </button>
      )}
      <div style={{ marginLeft: sidebarOpen ? 240 : 0, transition: "margin-left 0.3s ease" }}>
        <h1 style={{ color: "#fff", marginBottom: 24 }}>Quản lý nghệ sĩ</h1>

        {/* Form thêm/sửa nghệ sĩ */}
        <form onSubmit={handleSubmit} style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          alignItems: "end",
          background: "#1e1e24",
          padding: 20,
          borderRadius: 12,
          border: "1px solid #2e2e37",
          width: "100%",
          marginBottom: 24
        }}>
          <label style={{ display: "grid", gap: 6, width: "100%" }}>
            <span>Tên nghệ sĩ *</span>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ví dụ: Taylor Swift"
              style={{ 
                padding: "10px 12px", 
                borderRadius: 8, 
                border: "1px solid #444", 
                background: "#1f1f1f", 
                color: "#fff",
                width: "100%",
                boxSizing: "border-box",
                height: "42px"
              }}
            />
          </label>

          <label style={{ display: "grid", gap: 6, width: "100%" }}>
            <span>Thể loại</span>
            <div style={{ width: "100%" }}>
              <SimpleGenreSelector
                genres={genres}
                value={form.genres}
                onChange={(selectedGenres) => setForm((f) => ({ ...f, genres: selectedGenres }))}
              />
            </div>
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Quốc gia</span>
            <input
              value={form.country}
              onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
              placeholder="Ví dụ: United States"
              style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #444", background: "#1f1f1f", color: "#fff" }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Năm debut</span>
            <input
              type="number"
              value={form.debutYear}
              onChange={(e) => setForm((f) => ({ ...f, debutYear: e.target.value }))}
              placeholder="Ví dụ: 2006"
              style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #444", background: "#1f1f1f", color: "#fff" }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Số người theo dõi</span>
            <input
              type="number"
              value={form.followers}
              onChange={(e) => setForm((f) => ({ ...f, followers: e.target.value }))}
              placeholder="Ví dụ: 1000000"
              style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #444", background: "#1f1f1f", color: "#fff" }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Số người nghe hàng tháng</span>
            <input
              type="number"
              value={form.monthlyListeners}
              onChange={(e) => setForm((f) => ({ ...f, monthlyListeners: e.target.value }))}
              placeholder="Ví dụ: 50000000"
              style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #444", background: "#1f1f1f", color: "#fff" }}
            />
          </label>

          <label style={{ display: "grid", gap: 6, gridColumn: "1 / -1" }}>
            <span>Tiểu sử</span>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              placeholder="Mô tả về nghệ sĩ..."
              rows={3}
              style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #444", background: "#1f1f1f", color: "#fff", resize: "vertical" }}
            />
          </label>

          <label style={{ display: "grid", gap: 6, gridColumn: "1 / -1" }}>
            <span>Ảnh đại diện</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setAvatarFile(e.target.files[0])}
              style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #444", background: "#1f1f1f", color: "#fff" }}
            />
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 8, gridColumn: "1 / -1" }}>
            <input
              type="checkbox"
              checked={form.isVerified}
              onChange={(e) => setForm((f) => ({ ...f, isVerified: e.target.checked }))}
              style={{ transform: "scale(1.2)" }}
            />
            <span>Nghệ sĩ được xác thực</span>
          </label>

          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 12, justifyContent: "flex-end" }}>
            {editingArtist && (
              <button
                type="button"
                onClick={resetForm}
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  border: "1px solid #666",
                  background: "transparent",
                  color: "#fff",
                  cursor: "pointer"
                }}
              >
                Hủy
              </button>
            )}
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: "none",
                background: "#1db954",
                color: "#fff",
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.7 : 1
              }}
            >
              {submitting ? "Đang xử lý..." : editingArtist ? "Cập nhật" : "Thêm nghệ sĩ"}
            </button>
          </div>
        </form>

        {/* Messages */}
        <div style={{ marginBottom: 16 }}>
          {error && <span style={{ color: "#ff6b6b" }}>{error}</span>}
          {success && <span style={{ color: "#80ffa6" }}>{success}</span>}
        </div>

        {/* Danh sách nghệ sĩ */}
        <div style={{
          background: "#1e1e24",
          borderRadius: 12,
          border: "1px solid #2e2e37",
          overflow: "hidden"
        }}>
          <div className="recommend-header" style={{ marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div className="recommend-title">Danh sách nghệ sĩ</div>
              <div style={{ opacity: 0.8, fontSize: 14 }}>
                {loadingArtists ? "Đang tải..." : `${artists.length} nghệ sĩ`}
              </div>
            </div>
            
            {/* Search Bar */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              maxWidth: "400px"
            }}>
              <input
                type="text"
                placeholder="Tìm kiếm nghệ sĩ, quốc gia, thể loại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #444",
                  background: "#1f1f1f",
                  color: "#fff",
                  fontSize: "14px",
                  minWidth: "300px"
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#888",
                    cursor: "pointer",
                    padding: "8px",
                    borderRadius: "4px",
                    fontSize: "16px"
                  }}
                  title="Xóa tìm kiếm"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          
          {searchQuery && (
            <div style={{
              color: "#b3b3b3",
              fontSize: "12px",
              marginBottom: "8px",
              paddingLeft: "12px"
            }}>
              Tìm thấy {filteredArtists.length} nghệ sĩ
            </div>
          )}

          <div style={{
            display: "grid",
            gridTemplateColumns: "0.5fr 1.5fr 1fr 1fr 0.8fr 0.8fr 0.6fr",
            gap: 8,
            color: "#b3b3b3",
            padding: "8px 12px",
            borderBottom: "1px solid #2e2e37",
            background: "#1a1a20"
          }}>
            <div>Ảnh</div>
            <div>Tên nghệ sĩ</div>
            <div>Thể loại</div>
            <div>Quốc gia</div>
            <div>Theo dõi</div>
            <div>Nghe tháng</div>
            <div style={{ textAlign: "right" }}>Hành động</div>
          </div>

          {filteredArtists.length > 0 ? (
            filteredArtists.map((artist) => (
              <ArtistRow 
                key={artist._id} 
                artist={artist} 
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))
          ) : (
            <div style={{
              padding: "40px 20px",
              textAlign: "center",
              color: "#888",
              fontSize: "14px"
            }}>
              {searchQuery ? "Không tìm thấy nghệ sĩ nào" : "Chưa có nghệ sĩ nào"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ArtistRow({ artist, onEdit, onDelete }) {
  const withMediaBase = (p) => (p && p.startsWith("/uploads") ? `${import.meta.env.VITE_API_URL}${p}` : p);

  const formatNumber = (num) => {
    if (!num) return "0";
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "0.5fr 1.5fr 1fr 1fr 0.8fr 0.8fr 0.6fr",
      gap: 8,
      padding: "12px",
      alignItems: "center",
      borderBottom: "1px solid #2e2e37",
      background: "transparent"
    }}>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <img
          src={withMediaBase(artist.avatar) || "/default-avatar.png"}
          alt={artist.name}
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            objectFit: "cover"
          }}
        />
      </div>
      <div>
        <div style={{ fontWeight: 600, color: "#fff" }}>
          {artist.name}
          {artist.isVerified && <span style={{ color: "#1db954", marginLeft: 4 }}>✓</span>}
        </div>
        {artist.debutYear && (
          <div style={{ color: "#9aa0a6", fontSize: 13 }}>
            Debut: {artist.debutYear}
          </div>
        )}
      </div>
      <div style={{ color: "#cfd3da" }}>
        {artist.genres && artist.genres.length > 0 
          ? artist.genres.filter(g => g && g.name).map(g => g.name).join(", ") 
          : "N/A"}
      </div>
      <div style={{ color: "#cfd3da" }}>
        {artist.country || "N/A"}
      </div>
      <div style={{ color: "#cfd3da" }}>
        {formatNumber(artist.followers)}
      </div>
      <div style={{ color: "#cfd3da" }}>
        {formatNumber(artist.monthlyListeners)}
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
        <button
          onClick={() => onEdit(artist)}
          style={{
            background: "transparent",
            border: "1px solid #666",
            color: "#fff",
            padding: "6px 12px",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: 12
          }}
        >
          Sửa
        </button>
        <button
          onClick={() => onDelete(artist._id)}
          style={{
            background: "transparent",
            border: "1px solid #ff6b6b",
            color: "#ff6b6b",
            padding: "6px 12px",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: 12
          }}
        >
          Xóa
        </button>
      </div>
    </div>
  );
}

// SimpleGenreSelector component - đơn giản hơn
function SimpleGenreSelector({ genres, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
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

  const toggleGenre = (genreId) => {
    if (value.includes(genreId)) {
      onChange(value.filter(id => id !== genreId));
    } else {
      onChange([...value, genreId]);
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: "relative", width: "100%" }}>
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
          height: "42px",
          width: "100%",
          boxSizing: "border-box",
          transition: "all 0.2s ease"
        }}
      >
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "4px", 
          flex: 1,
          overflow: "hidden"
        }}>
          {selectedGenres.length > 0 ? (
            selectedGenres.map(genre => (
              <span
                key={genre._id}
                style={{
                  background: "#1db954",
                  color: "#fff",
                  padding: "2px 6px",
                  borderRadius: 4,
                  fontSize: 11,
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  whiteSpace: "nowrap",
                  flexShrink: 0
                }}
              >
                {genre.name}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleGenre(genre._id);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: 10,
                    padding: 0,
                    width: 14,
                    height: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%"
                  }}
                >
                  ×
                </button>
              </span>
            ))
          ) : (
            <span style={{ color: "#888", fontSize: "14px" }}>Chọn thể loại...</span>
          )}
        </div>
        <span style={{ color: "#888", marginLeft: 8 }}>
          {isOpen ? "▲" : "▼"}
        </span>
      </div>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "#1f1f1f",
            border: "1px solid #444",
            borderRadius: 8,
            marginTop: 4,
            maxHeight: 200,
            overflowY: "auto",
            zIndex: 1000
          }}
        >
          {genres.map(genre => (
            <div
              key={genre._id}
              onClick={() => toggleGenre(genre._id)}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                background: value.includes(genre._id) ? "#1db954" : "transparent",
                color: value.includes(genre._id) ? "#fff" : "#e5e5e5",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              <input
                type="checkbox"
                checked={value.includes(genre._id)}
                onChange={() => {}} // Handled by parent onClick
                style={{ margin: 0 }}
              />
              {genre.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ArtistsAdmin;
