import { useState, useRef, useEffect, forwardRef } from "react";
import { usePlayer } from "./PlayerContext";

const Header = forwardRef(({ showSearch = true, onSearchChange, onSearchFocus, searchValue = "", showSearchResults = false }, ref) => {
  const [searchQuery, setSearchQuery] = useState(searchValue);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [songs, setSongs] = useState([]);
  const [dropdownPosition, setDropdownPosition] = useState({ left: 0, top: 0, width: 0 });
  const searchWrapRef = useRef(null);
  const searchInputRef = useRef(null);
  const { setQueueAndPlay, setCurrentIdx, setIsPlaying, setQueueContext, queue, setQueue } = usePlayer();

  const withMediaBase = (p) => (p && p.startsWith("/uploads") ? `http://localhost:5000${p}` : p);

  // Play song function - same logic as App.jsx
  const playSong = (idx) => {
    if (idx >= 0 && idx < songs.length && songs.length > 0) {
      // Check if queue needs to be updated (same logic as App.jsx)
      const queueMismatch = !queue || queue.length !== songs.length || songs.some((s, i) => queue[i]?._id !== s._id);
      
      if (queueMismatch) {
        // Try setQueueAndPlay first
        setQueueAndPlay(songs, idx);
        
        // Fallback: set queue directly and then play
        setTimeout(() => {
          setQueue(songs);
          setCurrentIdx(idx);
          setIsPlaying(true);
        }, 100);
      } else {
        setCurrentIdx(idx);
        setIsPlaying(true);
      }
      
      // Set queue context
      setQueueContext("search");
    }
  };

  // Load songs
  useEffect(() => {
    fetch("http://localhost:5000/api/songs")
      .then((r) => r.json())
      .then((data) => setSongs(data || []))
      .catch((e) => console.error("Error loading songs:", e));
  }, []);

  // Search function
  const normalize = (str) => {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[đĐ]/g, "d");
  };

  // Update search results
  useEffect(() => {
    const q = normalize(searchQuery.trim());
    if (!q) {
      setSearchResults([]);
      return;
    }
    const filtered = songs.filter((song) => {
      const title = normalize(song.title || "");
      const artist = normalize(song.artist || "");
      return title.includes(q) || artist.includes(q);
    });
    setSearchResults(filtered);
  }, [searchQuery, songs]);


  // Calculate dropdown position - same as App.jsx
  const updateDropdownPosition = () => {
    const searchInput = document.querySelector('.header input[type="text"]');
    if (searchInput) {
      const rect = searchInput.getBoundingClientRect();
      setDropdownPosition({
        left: rect.left,
        top: rect.bottom + 4,
        width: rect.width
      });
    } else {
      const altInput = searchInputRef.current;
      if (altInput) {
        const rect = altInput.getBoundingClientRect();
        setDropdownPosition({
          left: rect.left,
          top: rect.bottom + 4,
          width: rect.width
        });
      }
    }
  };




  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (onSearchChange) {
      onSearchChange(value);
    }
    
    // Always show dropdown and update position
    updateDropdownPosition();
    setShowDropdown(true);
  };

  // Handle Enter key press
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      // If not on home page, navigate to home with search query
      if (!showSearchResults) {
        window.location.hash = `#/?search=${encodeURIComponent(searchQuery.trim())}`;
      }
      setShowDropdown(false);
    }
  };


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update dropdown position when dropdown shows - same as App.jsx
  useEffect(() => {
    if (showDropdown) {
      updateDropdownPosition();
    }
  }, [showDropdown]);




  return (
    <header ref={ref} className="header">
      <div className="header-logo-block">
        <span 
          className="logo-gradient" 
          style={{ cursor: "pointer" }}
          onClick={() => window.location.hash = "#/"}
        >
          CoreSound
        </span>
        
        {showSearch && (
          <div 
            ref={searchWrapRef} 
            style={{ 
              position: "relative", 
              marginLeft: 16, 
              width: 360, 
              minWidth: 360,
              maxWidth: 360,
              display: "inline-block",
              flexShrink: 0,
              boxSizing: "border-box"
            }}
          >
            <input
              type="text"
              placeholder="Tìm kiếm bài hát hoặc nghệ sĩ..."
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (onSearchFocus) {
                  onSearchFocus();
                }
                updateDropdownPosition();
                setShowDropdown(true);
              }}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #444",
                background: "#1f1f1f",
                color: "#fff",
                fontSize: "14px",
                boxSizing: "border-box"
              }}
            />
            
            
            
          </div>
        )}
      </div>
      
      {/* User Section - Will be added later */}
      <div className="header-user-section" style={{ marginRight: "1rem" }}>
        {/* Placeholder for user menu, notifications, etc. */}
        <div style={{ 
          padding: "0.5rem 1.2rem", 
          color: "#b3b3b3", 
          fontSize: "0.9rem",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "20px",
          cursor: "pointer",
          transition: "all 0.2s ease",
          whiteSpace: "nowrap"
        }}
        onMouseEnter={(e) => {
          e.target.style.borderColor = "#1db954";
          e.target.style.color = "#1db954";
        }}
        onMouseLeave={(e) => {
          e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
          e.target.style.color = "#b3b3b3";
        }}
        >
          Đăng nhập
        </div>
      </div>
      
      {/* Search Dropdown - Simple search for non-home pages */}
      {!showSearchResults && showDropdown && dropdownPosition.width > 0 && (
        <div style={{
          position: "fixed",
          left: dropdownPosition.left,
          top: dropdownPosition.top,
          width: dropdownPosition.width,
          background: "#1e1e24",
          border: "1px solid #2e2e37",
          borderRadius: 8,
          boxShadow: "0 6px 18px rgba(0,0,0,0.3)",
          zIndex: 1000,
          maxHeight: 360,
          overflowY: "auto"
        }}>
          {searchQuery.trim() ? (
            <div>
              {/* Simple search results - only show when typing */}
              {searchResults.length > 0 ? (
                <div>
                  {searchResults.slice(0, 8).map((song) => (
                    <div key={song._id} 
                      onMouseDown={(e) => {
                        // Handle the click logic here since onMouseUp doesn't work
                        
                        // Find song index and play directly
                        const realIdx = songs.findIndex((s) => s._id === song._id);
                        if (realIdx !== -1 && songs.length > 0) {
                          playSong(realIdx);
                        } else {
                          // If not found or songs not loaded, reload and play
                          fetch("http://localhost:5000/api/songs")
                            .then((r) => r.json())
                            .then((data) => {
                              const newSongs = data || [];
                              const newIdx = newSongs.findIndex((s) => s._id === song._id);
                              if (newIdx !== -1) {
                                setSongs(newSongs);
                                setQueueAndPlay(newSongs, newIdx);
                                setQueueContext("search");
                              }
                            })
                            .catch((e) => console.error("Error reloading songs:", e));
                        }
                        setShowDropdown(false);
                        
                        // Prevent default and stop propagation after handling
                        e.preventDefault();
                        e.stopPropagation();
                      }} 
                      style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 10, 
                      padding: "8px 12px", 
                      cursor: "pointer",
                      borderBottom: "1px solid #2a2a34",
                      transition: "background-color 0.2s ease"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#2a2a34"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <img 
                        src={withMediaBase(song.cover) || "/default-cover.png"} 
                        alt={song.title} 
                        style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover", pointerEvents: "none" }} 
                      />
                      <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                        <span style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#fff" }}>{song.title}</span>
                        <span style={{ color: "#b3b3b3", fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.artist}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: "16px 12px", color: "#b3b3b3", textAlign: "center" }}>
                  Không tìm thấy kết quả cho "{searchQuery}"
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: "16px 12px", color: "#b3b3b3", textAlign: "center" }}>
              <div style={{ marginBottom: "8px" }}>Nhập tên bài hát để tìm kiếm</div>
              <div style={{ fontSize: "11px", opacity: 0.8 }}>Kết quả sẽ hiển thị khi bạn gõ</div>
            </div>
          )}
        </div>
      )}
    </header>
  );
});

Header.displayName = 'Header';

export default Header;
