import { useState, useRef, useEffect, forwardRef } from "react";
import { usePlayer } from "./PlayerContext";
import { useSearch } from "./SearchContext";
import { useAuth } from "./AuthContext";
import LoginModal from "./LoginModal";
import SignupModal from "./SignupModal";
import NotificationBell from "./NotificationBell";
import GameIcon from "./GameIcon";

const Header = forwardRef(({ showSearch = true, onSearchChange, onSearchFocus, searchValue = "", showSearchResults = false }, ref) => {
  const [searchQuery, setSearchQuery] = useState(searchValue);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [songs, setSongs] = useState([]);
  const [dropdownPosition, setDropdownPosition] = useState({ left: 0, top: 0, width: 0 });
  const searchWrapRef = useRef(null);
  const searchInputRef = useRef(null);
  const { setQueueAndPlay, setCurrentIdx, setIsPlaying, setQueueContext, queue, setQueue } = usePlayer();
  const { searchHistory, addToSearchHistory, removeFromSearchHistory } = useSearch();
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userDropdownRef = useRef(null);

  const withMediaBase = (p) => (p && p.startsWith("/uploads") ? `http://localhost:5000${p}` : p);

  // Play song function - simplified for better reliability
  const playSong = (idx) => {
    if (idx >= 0 && idx < songs.length && songs.length > 0) {
      // Always use setQueueAndPlay for consistency
      setQueueAndPlay(songs, idx);
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
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
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
        
        {/* Navigation Menu */}
        <nav className="header-nav">
          <a 
            href="#/" 
            className="nav-link"
            style={{ 
              color: window.location.hash === "#/" || window.location.hash === "" ? "#1db954" : "#b3b3b3",
              textDecoration: "none",
              padding: "8px 16px",
              borderRadius: "6px",
              transition: "all 0.2s ease",
              fontSize: "14px",
              fontWeight: "500"
            }}
          >
            Trang chủ
          </a>
          <a 
            href="#/genres" 
            className="nav-link"
            style={{ 
              color: window.location.hash.startsWith("#/genres") ? "#1db954" : "#b3b3b3",
              textDecoration: "none",
              padding: "8px 16px",
              borderRadius: "6px",
              transition: "all 0.2s ease",
              fontSize: "14px",
              fontWeight: "500"
            }}
          >
            Thể loại
          </a>
        </nav>
        
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
      
      {/* User Section */}
      <div className="header-user-section" style={{ marginRight: "1rem", display: "flex", alignItems: "center" }}>
        {isAuthenticated ? (
          <>
            {/* Game Icon */}
            <GameIcon />
            
            {/* Notification Bell */}
            <NotificationBell />
            
            {/* User Avatar with Dropdown */}
            <div ref={userDropdownRef} style={{ position: "relative" }}>
            {/* Avatar Button */}
            <div
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: user?.avatar ? 
                  `url(${user.avatar.startsWith('http') ? user.avatar : `http://localhost:5000${user.avatar}`})` :
                  "linear-gradient(135deg, #1db954, #1ed760)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.3s ease",
                border: "2px solid rgba(255, 255, 255, 0.1)",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)"
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "scale(1.05)";
                e.target.style.boxShadow = "0 4px 12px rgba(29, 185, 84, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "scale(1)";
                e.target.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.2)";
              }}
            >
              {!user?.avatar && (user?.name?.charAt(0)?.toUpperCase() || "U")}
            </div>

            {/* User Dropdown Menu */}
            {showUserDropdown && (
              <div style={{
                position: "absolute",
                top: "100%",
                right: "0",
                marginTop: "8px",
                minWidth: "200px",
                background: "#1e1e24",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "12px",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
                zIndex: 1000,
                overflow: "hidden",
                animation: "dropdownSlideIn 0.2s ease-out"
              }}>
                {/* User Info Header */}
                <div style={{
                  padding: "1rem",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                  background: "rgba(255, 255, 255, 0.02)"
                }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem"
                  }}>
                    <div style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: user?.avatar ? 
                        `url(${user.avatar.startsWith('http') ? user.avatar : `http://localhost:5000${user.avatar}`})` :
                        "linear-gradient(135deg, #1db954, #1ed760)",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: "1rem",
                      fontWeight: "600"
                    }}>
                      {!user?.avatar && (user?.name?.charAt(0)?.toUpperCase() || "U")}
                    </div>
                    <div>
                      <div style={{
                        color: "#fff",
                        fontSize: "0.9rem",
                        fontWeight: "600",
                        lineHeight: 1.2
                      }}>
                        {user?.name}
                      </div>
                      <div style={{
                        color: "#b3b3b3",
                        fontSize: "0.8rem",
                        lineHeight: 1.2
                      }}>
                        {isAdmin ? "Quản trị viên" : "Người dùng"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div style={{ padding: "0.5rem 0" }}>
                  {/* Profile Link */}
                  <div
                    onClick={() => {
                      window.location.hash = "#/profile";
                      setShowUserDropdown(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.75rem 1rem",
                      color: "#fff",
                      cursor: "pointer",
                      transition: "background-color 0.2s ease",
                      fontSize: "0.9rem"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(29, 185, 84, 0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <span>Hồ sơ</span>
                  </div>

                  {/* Favorites Link */}
                  <div
                    onClick={() => {
                      window.location.hash = "#/favorites";
                      setShowUserDropdown(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.75rem 1rem",
                      color: "#fff",
                      cursor: "pointer",
                      transition: "background-color 0.2s ease",
                      fontSize: "0.9rem"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(29, 185, 84, 0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <span>Yêu thích</span>
                  </div>

                  {/* Library Link */}
                  <div
                    onClick={() => {
                      window.location.hash = "#/library";
                      setShowUserDropdown(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.75rem 1rem",
                      color: "#fff",
                      cursor: "pointer",
                      transition: "background-color 0.2s ease",
                      fontSize: "0.9rem"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(29, 185, 84, 0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <span>Thư viện</span>
                  </div>

                  {/* Admin Panel Link */}
                  {isAdmin && (
                    <div
                      onClick={() => {
                        window.location.hash = "#/upload";
                        setShowUserDropdown(false);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        padding: "0.75rem 1rem",
                        color: "#fff",
                        cursor: "pointer",
                        transition: "background-color 0.2s ease",
                        fontSize: "0.9rem"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(29, 185, 84, 0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <span>Bảng quản trị</span>
                    </div>
                  )}

                  {/* Logout Button */}
                  <div
                    onClick={() => {
                      logout();
                      setShowUserDropdown(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.75rem 1rem",
                      color: "#ff6b6b",
                      cursor: "pointer",
                      transition: "background-color 0.2s ease",
                      fontSize: "0.9rem"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(255, 107, 107, 0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <span>Đăng xuất</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          </>
        ) : (
          /* Auth Buttons */
          <>
            {/* Sign Up Button */}
            <div style={{ 
              padding: "0.6rem 1.4rem", 
              color: "#fff", 
              fontSize: "0.9rem",
              fontWeight: "600",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "25px",
              cursor: "pointer",
              transition: "all 0.3s ease",
              whiteSpace: "nowrap",
              marginRight: "0.4rem",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              backdropFilter: "blur(10px)"
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = "#1db954";
              e.target.style.color = "#1db954";
              e.target.style.background = "rgba(29, 185, 84, 0.15)";
              e.target.style.transform = "translateY(-1px)";
              e.target.style.boxShadow = "0 4px 12px rgba(29, 185, 84, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = "rgba(255, 255, 255, 0.15)";
              e.target.style.color = "#fff";
              e.target.style.background = "rgba(255, 255, 255, 0.05)";
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
            }}
            onClick={() => setShowSignupModal(true)}
            >
              Đăng ký
            </div>
            
            {/* Sign In Button */}
            <div style={{ 
              padding: "0.6rem 1.4rem", 
              color: "#b3b3b3", 
              fontSize: "0.9rem",
              fontWeight: "500",
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "25px",
              cursor: "pointer",
              transition: "all 0.3s ease",
              whiteSpace: "nowrap",
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.08)",
              backdropFilter: "blur(10px)"
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = "#1db954";
              e.target.style.color = "#1db954";
              e.target.style.background = "rgba(29, 185, 84, 0.1)";
              e.target.style.transform = "translateY(-1px)";
              e.target.style.boxShadow = "0 4px 12px rgba(29, 185, 84, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = "rgba(255, 255, 255, 0.08)";
              e.target.style.color = "#b3b3b3";
              e.target.style.background = "rgba(255, 255, 255, 0.03)";
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.08)";
            }}
            onClick={() => setShowLoginModal(true)}
            >
              Đăng nhập
            </div>
          </>
        )}
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
                        // Add to search history
                        addToSearchHistory(song);
                        
                        // Simplified approach: always fetch fresh songs and play
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
                          .catch((e) => console.error("Error loading songs:", e));
                        
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
            <div>
              {searchHistory.length > 0 ? (
                <div>
                  {searchHistory.slice(0, 8).map((song) => (
                    <div key={song._id} 
                      onMouseDown={(e) => {
                        // Simplified approach: always fetch fresh songs and play
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
                          .catch((e) => console.error("Error loading songs:", e));
                        
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
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          removeFromSearchHistory(song._id); 
                        }} 
                        title="Xóa khỏi lịch sử" 
                        style={{ 
                          background: "transparent", 
                          border: "none", 
                          color: "#b3b3b3", 
                          fontSize: 16, 
                          cursor: "pointer", 
                          padding: 4, 
                          lineHeight: 1,
                          borderRadius: 4,
                          transition: "all 0.2s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = "#ff4444";
                          e.target.style.color = "#fff";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = "transparent";
                          e.target.style.color = "#b3b3b3";
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: "16px 12px", color: "#b3b3b3", textAlign: "center" }}>
                  <div style={{ marginBottom: "8px" }}>Chưa có lịch sử tìm kiếm</div>
                  <div style={{ fontSize: "11px", opacity: 0.8 }}>Tìm kiếm bài hát để xem lịch sử</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToSignup={() => {
          setShowLoginModal(false);
          setShowSignupModal(true);
        }}
      />
      
      <SignupModal 
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onSwitchToLogin={() => {
          setShowSignupModal(false);
          setShowLoginModal(true);
        }}
      />
    </header>
  );
});

Header.displayName = 'Header';

export default Header;
