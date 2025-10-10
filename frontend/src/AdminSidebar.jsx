import { useEffect, useState, useRef } from "react";

function AdminSidebar({ open, onToggle }) {
  const hash = typeof window !== "undefined" ? window.location.hash : "#/";
  const sidebarRef = useRef(null);
  
  const linkStyle = (active) => ({
    display: "block",
    padding: "10px 12px",
    borderRadius: 8,
    color: active ? "#1db954" : "#e5e5e5",
    background: active ? "#1f2a1f" : "transparent",
    textDecoration: "none",
    fontWeight: active ? 700 : 500,
  });

  // Đóng sidebar khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target) && open) {
        onToggle();
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, onToggle]);

  return (
    <>
      {/* Overlay khi sidebar mở */}
      {open && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            zIndex: 999
          }}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        ref={sidebarRef}
        style={{ 
          position: "fixed", 
          left: open ? 0 : -240, 
          top: 0, 
          bottom: 0, 
          width: 220, 
          background: "#151518", 
          borderRight: "1px solid #23232b", 
          padding: 16, 
          transition: "left 0.3s ease",
          zIndex: 1000,
          boxShadow: open ? "2px 0 10px rgba(0, 0, 0, 0.3)" : "none"
        }}
      >
        <div className="logo-gradient" style={{ fontSize: 22, marginBottom: 12 }}>CoreSound Admin</div>
        <nav style={{ display: "grid", gap: 6 }}>
        <a href="#/" style={linkStyle(hash === "#/" || hash === "#/")}>Trang chủ</a>
        <a href="#/upload" style={linkStyle(hash.startsWith("#/upload"))}>Bài hát</a>
        <a href="#/albums-admin" style={linkStyle(hash.startsWith("#/albums-admin"))}>Album</a>
        <a href="#/artists-admin" style={linkStyle(hash.startsWith("#/artists-admin"))}>Nghệ sĩ</a>
        <a href="#/genres-admin" style={linkStyle(hash.startsWith("#/genres-admin"))}>Thể loại</a>
        <a href="#/regions-admin" style={linkStyle(hash.startsWith("#/regions-admin"))}>Khu vực</a>
        <a href="#/users-admin" style={linkStyle(hash.startsWith("#/users-admin"))}>Người dùng</a>
        <a href="#/playlists-admin" style={linkStyle(hash.startsWith("#/playlists-admin"))}>Playlist</a>
        <a href="#/lyrics-admin" style={linkStyle(hash.startsWith("#/lyrics-admin"))}>Lyrics</a>
        <a href="#/statistics-admin" style={linkStyle(hash.startsWith("#/statistics-admin"))}>Thống kê</a>
        </nav>
        <button 
          onClick={onToggle} 
          style={{ 
            marginTop: 16, 
            padding: "8px 10px", 
            borderRadius: 8, 
            border: "1px solid #2e2e37", 
            background: "#23232b", 
            color: "#fff", 
            cursor: "pointer", 
            width: "100%" 
          }}
        >
          {open ? "Ẩn menu" : "Hiện menu"}
        </button>
      </aside>
    </>
  );
}

export default AdminSidebar;
