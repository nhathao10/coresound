import { useEffect, useRef, useState } from "react";
import "./App.css";
import { FaPlay, FaPause, FaCheckCircle, FaPodcast } from "react-icons/fa";
import { usePlayer } from "./PlayerContext.jsx";
import { useSearch } from "./SearchContext.jsx";
import { useAuth } from "./AuthContext.jsx";
import { useToast } from "./ToastContext.jsx";
import Header from "./Header.jsx";
import HeartIcon from "./HeartIcon.jsx";
import AddToPlaylistIcon from "./AddToPlaylistIcon.jsx";
import FollowButton from "./FollowButton.jsx";

function App() {
  const [songs, setSongs] = useState([]);
  const [albums, setAlbums] = useState([]);
  const withMediaBase = (p) => (p && p.startsWith("/uploads") ? `${import.meta.env.VITE_API_URL}${p}` : p);
  const { setQueueAndPlay, currentIdx, isPlaying, setIsPlaying, queue, setCurrentIdx, current, setQueueContext, setQueue } = usePlayer();
  const { user, isAuthenticated } = useAuth();
  const { showSuccess, showError } = useToast();
  const [displayedSongs, setDisplayedSongs] = useState([]); // 7 bài hát hiển thị
  const [displayedAlbums, setDisplayedAlbums] = useState([]); // 7 album hiển thị
  const [curatedPlaylists, setCuratedPlaylists] = useState([]); // Curated playlists
  const [displayedPlaylists, setDisplayedPlaylists] = useState([]); // 7 playlist hiển thị
  const [podcasts, setPodcasts] = useState([]); // Podcasts
  const [displayedPodcasts, setDisplayedPodcasts] = useState([]); // 7 podcast hiển thị
 // Danh sách ID podcast yêu thích
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [recentSongs, setRecentSongs] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchWrapRef = useRef(null);
  const [trendingSongs, setTrendingSongs] = useState({
    vietnam: [],
    usuk: [],
    korea: []
  });
  const [trendingFilter, setTrendingFilter] = useState("region"); // "region" hoặc "genre"
  const [genres, setGenres] = useState([]);
  const [selectedGenres] = useState(["Pop", "R/B", "Rap"]);
  const [showNextSongPanel, setShowNextSongPanel] = useState(false);
  const [currentQueue, setCurrentQueue] = useState([]);
  const [artists, setArtists] = useState([]);
  const [followedArtists, setFollowedArtists] = useState(new Set());
  const [dropdownPosition, setDropdownPosition] = useState({ left: 0, top: 0, width: 0 });
  const [hoveredSongId, setHoveredSongId] = useState(null);
  const { searchHistory, addToSearchHistory, removeFromSearchHistory } = useSearch();


  // Calculate dropdown position based on search input
  const updateDropdownPosition = () => {
    const searchInput = document.querySelector('.header input[type="text"]');
    if (searchInput) {
      const rect = searchInput.getBoundingClientRect();
      setDropdownPosition({
        left: rect.left,
        top: rect.bottom + 4,
        width: rect.width
      });
    }
  };

  useEffect(() => {
    const fetchBootstrapData = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bootstrap`);
        if (!response.ok) throw new Error('Bootstrap failed');
        const data = await response.json();

        setSongs(Array.isArray(data.songs) ? data.songs : []);
        setAlbums(Array.isArray(data.albums) ? data.albums : []);
        setGenres(Array.isArray(data.genres) ? data.genres : []);
        setArtists(Array.isArray(data.artists) ? data.artists : []);
        setCuratedPlaylists(Array.isArray(data.curatedPlaylists) ? data.curatedPlaylists : []);
        setPodcasts(Array.isArray(data.podcasts) ? data.podcasts : []);

        // Check for search query in URL
        const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
        const searchParam = urlParams.get('search');
        if (searchParam) {
          setSearchQuery(searchParam);
          window.location.hash = '#/';
        }
      } catch (err) {
        console.error('Error fetching bootstrap data:', err);
      }
    };

    fetchBootstrapData();
  }, []);

  // Use Memo for random displays to avoid flickering and improve speed
  useEffect(() => {
    if (songs.length > 0) setDisplayedSongs(getRandomSongs(songs, 7));
  }, [songs]);

  useEffect(() => {
    if (albums.length > 0) setDisplayedAlbums(getRandomAlbums(albums, 7));
  }, [albums]);

  useEffect(() => {
    if (curatedPlaylists.length > 0) setDisplayedPlaylists(getRandomPlaylists(curatedPlaylists, 7));
  }, [curatedPlaylists]);

  useEffect(() => {
    if (podcasts.length > 0) setDisplayedPodcasts(getRandomPodcasts(podcasts, 5));
  }, [podcasts]);


  // Optimized trending songs calculation using local data
  useEffect(() => {
    if (songs.length === 0) return;

    const currentSongs = Array.isArray(songs) ? songs : [];
    
    if (trendingFilter === "region") {
      const generateTrending = (keywordArray) => {
        return currentSongs
          .filter(song => song.region?.name && keywordArray.some(kw => song.region.name.toLowerCase().includes(kw)))
          .sort((a, b) => (b.weeklyPlays || 0) - (a.weeklyPlays || 0) || (b.plays || 0) - (a.plays || 0))
          .slice(0, 5);
      };

      setTrendingSongs({
        vietnam: generateTrending(['vietnam', 'việt nam', 'viet nam']),
        usuk: generateTrending(['us', 'uk', 'america', 'britain', 'âu mỹ', 'au my', 'mỹ', 'anh']),
        korea: generateTrending(['korea', 'k-pop', 'kpop', 'hàn quốc', 'han quoc'])
      });
    } else {
      const fixedGenres = ["Pop", "R/B", "Rap"];
      const genreLists = fixedGenres.map(genre => 
        currentSongs
          .filter(song => song.genres?.some(g => g.name?.toLowerCase().includes(genre.toLowerCase())))
          .sort((a, b) => (b.weeklyPlays || 0) - (a.weeklyPlays || 0) || (b.plays || 0) - (a.plays || 0))
          .slice(0, 5)
      );

      setTrendingSongs({
        vietnam: genreLists[0] || [],
        usuk: genreLists[1] || [],
        korea: genreLists[2] || []
      });
    }
  }, [songs, trendingFilter]);

  // Load recent songs history
  useEffect(() => {
    try {
      const raw = localStorage.getItem("cs_recent_songs");
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setRecentSongs(arr);
      }
    } catch {}
  }, []);

  const saveRecentSong = (song) => {
    if (!song || !song._id) return;
    const item = { _id: song._id, title: song.title, artist: song.artist, cover: song.cover };
    setRecentSongs((prev) => {
      const deduped = prev.filter((s) => s._id !== item._id);
      const next = [item, ...deduped].slice(0, 8);
      try { localStorage.setItem("cs_recent_songs", JSON.stringify(next)); } catch {}
      return next;
    });
  };
  const removeRecentSong = (id) => {
    setRecentSongs((prev) => {
      const next = prev.filter((s) => s._id !== id);
      try { localStorage.setItem("cs_recent_songs", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  // Hide dropdown when clicking outside
  useEffect(() => {
    const onDoc = (e) => {
      if (!searchWrapRef.current) return;
      if (!searchWrapRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);


  // Hàm lấy 7 bài hát ngẫu nhiên (tránh trùng với danh sách hiện tại)
  const getRandomSongs = (allSongs, count, excludeIds = []) => {
    if (!Array.isArray(allSongs)) return [];
    if (allSongs.length <= count) return allSongs;
    
    // Lọc ra những bài hát không có trong danh sách hiện tại
    const availableSongs = allSongs.filter(song => !excludeIds.includes(song._id));
    
    // Nếu không đủ bài hát khác, thì lấy tất cả
    if (availableSongs.length < count) {
      const shuffled = [...allSongs].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    }
    
    // Lấy ngẫu nhiên từ những bài hát còn lại
    const shuffled = [...availableSongs].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  // Hàm lấy 7 album ngẫu nhiên (tránh trùng với danh sách hiện tại)
  const getRandomAlbums = (allAlbums, count, excludeIds = []) => {
    if (!Array.isArray(allAlbums)) return [];
    if (allAlbums.length <= count) return allAlbums;
    
    // Lọc ra những album không có trong danh sách hiện tại
    const availableAlbums = allAlbums.filter(album => !excludeIds.includes(album._id));
    
    // Nếu không đủ album khác, thì lấy tất cả
    if (availableAlbums.length < count) {
      const shuffled = [...allAlbums].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    }
    
    // Lấy ngẫu nhiên từ những album còn lại
    const shuffled = [...availableAlbums].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  // Hàm lấy 7 playlist ngẫu nhiên (tránh trùng với danh sách hiện tại)
  const getRandomPlaylists = (allPlaylists, count, excludeIds = []) => {
    if (!Array.isArray(allPlaylists)) return [];
    if (allPlaylists.length <= count) return allPlaylists;
    
    // Lọc ra những playlist không có trong danh sách hiện tại
    const availablePlaylists = allPlaylists.filter(playlist => !excludeIds.includes(playlist._id));
    
    // Nếu không đủ playlist khác, thì lấy tất cả
    if (availablePlaylists.length < count) {
      const shuffled = [...allPlaylists].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    }
    
    // Lấy ngẫu nhiên từ những playlist còn lại
    const shuffled = [...availablePlaylists].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  // Hàm làm mới danh sách gợi ý
  const refreshRecommendations = () => {
    const currentSongIds = displayedSongs.map(song => song._id);
    setDisplayedSongs(getRandomSongs(songs, 7, currentSongIds));
  };

  // Hàm làm mới danh sách album
  const refreshAlbums = () => {
    const currentAlbumIds = displayedAlbums.map(album => album._id);
    setDisplayedAlbums(getRandomAlbums(albums, 7, currentAlbumIds));
  };

  const getRandomPodcasts = (allPodcasts, count, excludeIds = []) => {
    if (!Array.isArray(allPodcasts)) return [];
    if (allPodcasts.length <= count) return allPodcasts;
    
    // Lọc ra những podcast không có trong danh sách hiện tại
    const availablePodcasts = allPodcasts.filter(podcast => !excludeIds.includes(podcast._id));
    
    // Nếu không đủ podcast khác, thì lấy tất cả
    if (availablePodcasts.length < count) {
      const shuffled = [...allPodcasts].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    }
    
    // Lấy ngẫu nhiên từ danh sách available
    const shuffled = [...availablePodcasts].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  // Hàm làm mới danh sách playlist
  const refreshPlaylists = () => {
    const currentPlaylistIds = displayedPlaylists.map(playlist => playlist._id);
    setDisplayedPlaylists(getRandomPlaylists(curatedPlaylists, 7, currentPlaylistIds));
  };

  const refreshPodcasts = () => {
    if (podcasts.length <= 5) {
      // Nếu tổng số podcast <= 5, không cần refresh
      return;
    }
    const currentPodcastIds = displayedPodcasts.map(podcast => podcast._id);
    const newPodcasts = getRandomPodcasts(podcasts, 5, currentPodcastIds);
    setDisplayedPodcasts(newPodcasts);
  };


  const playSong = (idx, context = "suggestions") => {
    // ensure the global queue contains the full songs list in the same order
    const queueMismatch = !queue || queue.length !== songs.length || songs.some((s, i) => queue[i]?._id !== s._id);
    if (queueMismatch) {
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
    
    // Set queue context and current queue
    setQueueContext(context);
    if (context === "suggestions") {
      setCurrentQueue(displayedSongs);
    } else if (context === "album") {
      // Find album songs if playing from album
      const currentSong = songs[idx];
      if (currentSong && currentSong.album) {
        const albumSongs = songs.filter(song => 
          song.album && song.album._id === currentSong.album._id
        );
        setCurrentQueue(albumSongs);
      } else {
        setCurrentQueue(songs);
      }
    }
  };

  const toggleFollowArtist = async (artistId) => {
    const isCurrentlyFollowed = followedArtists.has(artistId);
    const action = isCurrentlyFollowed ? 'unfollow' : 'follow';
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/artists/${artistId}/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update follow status');
      }
      
      // Update local follow state
      setFollowedArtists(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyFollowed) {
          newSet.delete(artistId);
        } else {
          newSet.add(artistId);
        }
        return newSet;
      });
      
      // Update artist followers count in local state
      setArtists(prev => prev.map(artist => 
        artist._id === artistId 
          ? { ...artist, followers: data.followers }
          : artist
      ));
      
    } catch (error) {
      console.error('Error updating follow status:', error);
      // Optionally show error message to user
      alert('Không thể cập nhật trạng thái theo dõi. Vui lòng thử lại.');
    }
  };

  // Định dạng thời gian mm:ss
  // local formatting helpers removed; global player renders UI

  // Chuẩn hóa chuỗi để tìm kiếm không phân biệt dấu, hoa/thường
  const normalize = (str) => {
    return (str || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  // Cập nhật kết quả tìm kiếm theo searchQuery
  useEffect(() => {
    const q = normalize(searchQuery.trim());
    if (!q) {
      setSearchResults([]);
      return;
    }
    const results = songs.filter((s) => {
      const inTitle = normalize(s.title).includes(q);
      const inArtist = normalize(s.artist).includes(q);
      return inTitle || inArtist;
    });
    setSearchResults(results);
  }, [searchQuery, songs]);

  // Định dạng số lượt nghe: 1K, 1M, 1B (giữ 1 số thập phân khi cần)
  const formatPlayCount = (num) => {
    if (num == null) return "0";
    const abs = Math.abs(num);
    const compact = (value) => {
      const fixed = value.toFixed(1);
      return fixed.endsWith(".0") ? String(Math.round(value)) : fixed;
    };
    if (abs >= 1_000_000_000) return `${compact(num / 1_000_000_000)}B`;
    if (abs >= 1_000_000) return `${compact(num / 1_000_000)}M`;
    if (abs >= 1_000) return `${compact(num / 1_000)}K`;
    return String(num);
  };

  // Chuỗi đầy đủ khi hover (theo locale vi-VN)
  const formatFullPlayCount = (num) => {
    if (num == null) return "0";
    const parsed = Number(num);
    return Number.isFinite(parsed) ? parsed.toLocaleString("vi-VN") : String(num);
  };

  // Tăng lượt nghe khi chọn sang bài hát mới
  useEffect(() => {
    if (!current) return;
    const id = current._id;
    if (!id) return;
    fetch(`${import.meta.env.VITE_API_URL}/api/songs/${id}/play`, { method: "POST" })
      .then((res) => res.json())
      .then((updated) => {
        setSongs((prev) =>
          prev.map((s) =>
            s._id === id ? { ...s, plays: updated.plays ?? (s.plays || 0) + 1 } : s
          )
        );
      })
      .catch(() => {
        setSongs((prev) =>
          prev.map((s) => (s._id === id ? { ...s, plays: (s.plays || 0) + 1 } : s))
        );
      });
  }, [current]);

  // Cập nhật tiêu đề tab khi có bài hát đang phát
  useEffect(() => {
    if (current && isPlaying) {
      document.title = `♪ ${current.title} - ${current.artist} | CoreSound`;
    } else {
      document.title = "CoreSound - Music Player";
    }
  }, [current, isPlaying]);

  // Update dropdown position on window resize
  useEffect(() => {
    const handleResize = () => {
      if (showDropdown) {
        updateDropdownPosition();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showDropdown]);


  // Load followed artists when user changes
  useEffect(() => {
    const loadFollowedArtists = async () => {
      if (isAuthenticated && user?.token) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/artists/followed`, {
            headers: {
              'Authorization': `Bearer ${user.token}`
            }
          });
          
          if (response.ok) {
            const artists = await response.json();
            const artistIds = artists.map(artist => artist._id);
            setFollowedArtists(new Set(artistIds));
            console.log('App: Loaded followed artists from API:', artistIds);
          } else {
            // Fallback to user data
            setFollowedArtists(new Set(user.followedArtists || []));
          }
        } catch (error) {
          console.error('Error loading followed artists:', error);
          // Fallback to user data
          setFollowedArtists(new Set(user.followedArtists || []));
        }
      } else {
        setFollowedArtists(new Set());
      }
    };
    
    loadFollowedArtists();
  }, [isAuthenticated, user?._id]);

  // Listen for user logout to clear followed artists
  useEffect(() => {
    const handleUserLoggedOut = () => {
      setFollowedArtists(new Set());
    };

    const handleFollowStatusChanged = (event) => {
      const { artistId, isFollowing } = event.detail;
      setFollowedArtists(prev => {
        const newSet = new Set(prev);
        if (isFollowing) {
          newSet.add(artistId);
        } else {
          newSet.delete(artistId);
        }
        console.log('App: Updated followed artists after follow change:', Array.from(newSet));
        return newSet;
      });
    };

    window.addEventListener('userLoggedOut', handleUserLoggedOut);
    window.addEventListener('followStatusChanged', handleFollowStatusChanged);
    
    return () => {
      window.removeEventListener('userLoggedOut', handleUserLoggedOut);
      window.removeEventListener('followStatusChanged', handleFollowStatusChanged);
    };
  }, []);

  return (
    <div className="music-app dark-theme">
      <Header 
        showSearch={true}
        showSearchResults={true}
        onSearchChange={(value) => {
          setSearchQuery(value);
          updateDropdownPosition();
          setShowDropdown(true);
        }}
        onSearchFocus={() => {
          updateDropdownPosition();
          setShowDropdown(true);
        }}
        searchValue={searchQuery}
      />
      
      {/* Search Dropdown - Keep the complex search logic in App.jsx for now */}
      {showDropdown && dropdownPosition.width > 0 && (
        <div ref={searchWrapRef} style={{ 
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
              {/* Search Results Only - No History when searching */}
              {searchResults.length > 0 ? (
                <div>
                  {searchResults.slice(0, 8).map((song) => (
                    <div key={song._id} onMouseDown={(e) => {
                      addToSearchHistory(song);
                      const realIdx = songs.findIndex((s) => s._id === song._id);
                      if (realIdx !== -1) {
                        playSong(realIdx);
                      } else {
                        // If not found in current songs array, try to reload and play
                        fetch(`${import.meta.env.VITE_API_URL}/api/songs`)
                          .then((r) => r.json())
                          .then((data) => {
                            const newSongs = data || [];
                            const newIdx = newSongs.findIndex((s) => s._id === song._id);
                            if (newIdx !== -1) {
                              setSongs(newSongs);
                              playSong(newIdx);
                            }
                          })
                          .catch((e) => console.error("Error reloading songs:", e));
                      }
                      setShowDropdown(false);
                      e.preventDefault();
                      e.stopPropagation();
                    }} style={{ 
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
                      <img src={withMediaBase(song.cover) || "/default-cover.png"} alt={song.title} style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover" }} />
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
                    <div key={song._id} onMouseDown={(e) => e.preventDefault()} style={{ 
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
                      <img src={withMediaBase(song.cover) || "/default-cover.png"} alt={song.title} style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover" }} />
                      <div 
                        onMouseDown={(e) => { 
                          const realIdx = songs.findIndex((s) => s._id === song._id);
                          if (realIdx !== -1) {
                            playSong(realIdx);
                          } else {
                            // If not found in current songs array, try to reload and play
                            fetch(`${import.meta.env.VITE_API_URL}/api/songs`)
                              .then((r) => r.json())
                              .then((data) => {
                                const newSongs = data || [];
                                const newIdx = newSongs.findIndex((s) => s._id === song._id);
                                if (newIdx !== -1) {
                                  setSongs(newSongs);
                                  playSong(newIdx);
                                }
                              })
                              .catch((e) => console.error("Error reloading songs:", e));
                          }
                          setShowDropdown(false);
                          e.preventDefault();
                          e.stopPropagation();
                        }} 
                        style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1, cursor: "pointer" }}
                      >
                        <span style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#fff" }}>{song.title}</span>
                          <span style={{ color: "#b3b3b3", fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.artist}</span>
                        </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeFromSearchHistory(song._id); }} 
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
      <main className="main-content">
        {searchQuery.trim() && (
          <section className="recommend-section recommend-section-horizontal">
            <div className="recommend-header">
              <div className="recommend-title">
                Kết Quả Tìm Kiếm
              </div>
              <div style={{ opacity: 0.8, fontSize: 14 }}>
                {searchResults.length} kết quả
              </div>
            </div>
            <div className="recommend-horizontal-list" style={{ gap: "1rem", gridAutoColumns: "200px" }}>
              {searchResults.map((song) => (
                <div
                  key={song._id}
                  className={`recommend-horizontal-card${
                    current && current._id === song._id ? " active" : ""
                  }`}
                  style={{ position: 'relative' }}
                  onMouseEnter={() => setHoveredSongId(song._id)}
                  onMouseLeave={() => setHoveredSongId(null)}
                >
                  <HeartIcon type="song" itemId={song._id} style={{ opacity: hoveredSongId === song._id ? 1 : 0 }} />
                  <AddToPlaylistIcon 
                    onClick={(e) => {
                      e.stopPropagation();
                      window.dispatchEvent(new CustomEvent('openAddToPlaylist', { 
                        detail: { song: song } 
                      }));
                    }}
                    style={{ opacity: hoveredSongId === song._id ? 1 : 0 }}
                  />
                  <img
                    className="recommend-horizontal-art"
                    src={withMediaBase(song.cover) || "/default-cover.png"}
                    alt={song.title}
                  />
                  <div className="recommend-horizontal-info">
                    <div className="recommend-horizontal-title">{song.title}</div>
                    <div className="recommend-horizontal-artist">{song.artist}</div>
                  </div>
                  {song.album?.name && (
                    <span className="recommend-horizontal-album" title={song.album.name}>
                      {song.album.name}
                    </span>
                  )}
                  <button
                    className="recommend-horizontal-play"
                    onClick={() => {
                      const realIdx = songs.findIndex((s) => s._id === song._id);
                      if (realIdx === -1) return;
                      const isCurrent = current && current._id === song._id;
                      if (isCurrent) {
                        setIsPlaying((prev) => !prev);
                      } else {
                          playSong(realIdx, "suggestions");
                      }
                    }}
                  >
                    {current && current._id === song._id && isPlaying ? <FaPause /> : <FaPlay />}
                  </button>
                </div>
              ))}
              {searchResults.length === 0 && (
                <div style={{ padding: 12, opacity: 0.8 }}>Không tìm thấy kết quả phù hợp.</div>
              )}
            </div>
          </section>
        )}
        <section className="recommend-section recommend-section-horizontal">
          <div className="recommend-header">
            <div className="recommend-title">Gợi Ý Bài Hát</div>
            <button
              className="refresh-btn"
              onClick={refreshRecommendations}
              title="Làm mới gợi ý"
            >
              ↻
            </button>
          </div>
          <div className="recommend-horizontal-list">
            {displayedSongs.map((song, idx) => (
              <div
                key={song._id}
                className={`recommend-horizontal-card${
                  current && current._id === song._id ? " active" : ""
                }`}
                style={{ position: 'relative' }}
                onMouseEnter={() => setHoveredSongId(song._id)}
                onMouseLeave={() => setHoveredSongId(null)}
              >
                <HeartIcon type="song" itemId={song._id} style={{ opacity: hoveredSongId === song._id ? 1 : 0 }} />
                <AddToPlaylistIcon 
                  onClick={(e) => {
                    e.stopPropagation();
                    window.dispatchEvent(new CustomEvent('openAddToPlaylist', { 
                      detail: { song: song } 
                    }));
                  }}
                  style={{ opacity: hoveredSongId === song._id ? 1 : 0 }}
                />
                <img
                  className="recommend-horizontal-art"
                  src={withMediaBase(song.cover) || "/default-cover.png"}
                  alt={song.title}
                />
                <div className="recommend-horizontal-info">
                  <div className="recommend-horizontal-title">
                    {song.title}
                    {song.premium && (
                      <span className="premium-badge">PREMIUM</span>
                    )}
                  </div>
                  <div className="recommend-horizontal-artist">
                    {song.artist}
                  </div>
                </div>
                {song.album?.name && (
                  <span className="recommend-horizontal-album" title={song.album.name}>
                    {song.album.name}
                  </span>
                )}
                <span
                  className="recommend-horizontal-plays"
                  title={formatFullPlayCount(song.plays)}
                >
                  {formatPlayCount(song.plays)}
                </span>
                <button
                  className="recommend-horizontal-play"
                  onClick={() => {
                    const realIdx = songs.findIndex((s) => s._id === song._id);
                    if (realIdx === -1) return;
                    const isCurrent = current && current._id === song._id;
                    if (isCurrent) {
                      setIsPlaying((prev) => !prev); // toggle play/pause khi click lại đúng bài đang phát
                    } else {
                      playSong(realIdx); // chuyển sang bài được click và phát luôn
                    }
                  }}
                >
                  {current && current._id === song._id && isPlaying ? <FaPause /> : <FaPlay />}
                </button>
              </div>
            ))}
          </div>
        </section>
        <section className="recommend-section recommend-section-horizontal">
          <div className="recommend-header">
            <div className="recommend-title">Album Mới</div>
            <button
              className="refresh-btn"
              onClick={refreshAlbums}
              title="Làm mới album"
            >
              ↻
            </button>
          </div>
          <div className="recommend-horizontal-list album-list">
            {displayedAlbums.map((al) => (
              <a key={al._id} href={`#/album/${encodeURIComponent(al._id)}`} className="recommend-horizontal-card" style={{ textDecoration: "none", color: "inherit", position: "relative" }}>
                <HeartIcon type="album" itemId={al._id} />
                <img
                  className="recommend-horizontal-art"
                  src={withMediaBase(al.cover) || "/default-cover.png"}
                  alt={al.name}
                />
                <div className="recommend-horizontal-info">
                  <div className="recommend-horizontal-title">{al.name}</div>
                  <div className="recommend-horizontal-artist">{al.artist}</div>
                </div>
                {typeof al.plays === "number" && (
                  <span className="recommend-horizontal-plays" title={formatFullPlayCount(al.plays)}>
                    {formatPlayCount(al.plays)}
                  </span>
                )}
              </a>
            ))}
          </div>
        </section>
        
        {/* Curated Playlists */}
        <section className="recommend-section recommend-section-horizontal">
          <div className="recommend-header">
            <div className="recommend-title">Playlist Đặc Biệt</div>
            <button
              className="refresh-btn"
              onClick={refreshPlaylists}
              title="Làm mới playlist"
            >
              ↻
            </button>
          </div>
          <div className="recommend-horizontal-list">
            {curatedPlaylists.length > 0 ? (
              displayedPlaylists.map((playlist) => (
                <a 
                  key={playlist._id} 
                  href={`#/playlist/${encodeURIComponent(playlist._id)}`} 
                  className="recommend-horizontal-card playlist-card" 
                  style={{ textDecoration: "none", color: "inherit", position: "relative" }}
                >
                  <img
                    className="recommend-horizontal-art"
                    src={withMediaBase(playlist.cover) || "/default-cover.png"}
                    alt={playlist.name}
                  />
                  <div className="recommend-horizontal-info">
                    <div className="recommend-horizontal-title">{playlist.name}</div>
                    <div className="recommend-horizontal-artist">{playlist.description || "Playlist đặc biệt"}</div>
                  </div>
                  <span className="recommend-horizontal-plays" title={`${playlist.songs?.length || 0} bài hát`}>
                    {playlist.songs?.length || 0} bài
                  </span>
                </a>
              ))
            ) : (
              <div style={{ 
                padding: "40px 20px", 
                textAlign: "center", 
                color: "#b3b3b3",
                fontSize: 16,
                gridColumn: "1 / -1"
              }}>
                <div style={{ marginBottom: 8 }}>Chưa có playlist đặc biệt nào</div>
                <div style={{ fontSize: 14, opacity: 0.8 }}>
                  Admin sẽ tạo các playlist đặc biệt để bạn thưởng thức
                </div>
              </div>
            )}
          </div>
        </section>
        
        {/* Podcasts */}
        <section className="recommend-section recommend-section-horizontal">
          <div className="recommend-header">
            <div className="recommend-title">Podcasts</div>
            <button
              className="refresh-btn"
              onClick={refreshPodcasts}
              title="Làm mới podcast"
            >
              ↻
            </button>
          </div>
          <div style={{ 
            gap: '1.5rem', 
            display: 'flex', 
            overflowX: 'auto', 
            paddingBottom: '0.5rem', 
            width: '100%',
            scrollbarWidth: 'none', /* Firefox */
            msOverflowStyle: 'none' /* IE and Edge */
          }} 
          className="hide-scrollbar"
          >
            {podcasts.length > 0 ? (
              displayedPodcasts.map((podcast) => (
                <div
                  key={podcast._id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    background: "#1a1a1a",
                    borderRadius: "12px",
                    padding: "0",
                    marginRight: "0px",
                    width: "280px",
                    flexShrink: 0,
                    cursor: "pointer",
                    textDecoration: "none",
                    color: "inherit",
                    boxShadow: "0 6px 12px rgba(0,0,0,0.4)",
                    border: "1px solid #333",
                    transition: "all 0.3s ease-in-out",
                    overflow: "hidden"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-5px)";
                    e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.6)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 6px 12px rgba(0,0,0,0.4)";
                  }}
                  onClick={() => {
                    console.log('Clicked podcast:', podcast); // Debug log
                    console.log('Podcast audioUrl:', podcast.audioUrl); // Debug audioUrl
                    if (podcast.audioUrl) {
                      // Tạo queue với tất cả podcast, podcast được click sẽ phát đầu tiên
                      const podcastQueue = podcasts
                        .filter(p => p.audioUrl) // Chỉ lấy podcast có audio
                        .map(p => ({
                          _id: p._id,
                          title: p.title,
                          artist: p.host,
                          url: withMediaBase(p.audioUrl),
                          cover: withMediaBase(p.cover) || "/default-cover.png",
                          duration: p.duration || 0,
                          type: 'podcast'
                        }));
                      
                      // Tìm index của podcast được click
                      const clickedIndex = podcastQueue.findIndex(p => p._id === podcast._id);
                      
                      if (clickedIndex !== -1) {
                        setQueueAndPlay(podcastQueue, clickedIndex);
                      }
                    } else {
                      alert('Podcast này chưa có nội dung để phát.');
                    }
                  }}
                >
                  {/* Ảnh bìa lớn ở trên */}
                  <div style={{ position: "relative", width: "100%", height: "140px", overflow: "hidden" }}>
                    <img
                      src={withMediaBase(podcast.cover) || "/default-cover.png"}
                      alt={podcast.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transition: "transform 0.3s ease"
                      }}
                      onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
                      onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
                    />
                    {/* Overlay gradient */}
                    <div style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: "60px",
                      background: "linear-gradient(transparent, rgba(0,0,0,0.7))"
                    }} />
                    
                    {/* Favorite button */}
                    <HeartIcon 
                      type="podcast" 
                      itemId={podcast._id}
                      style={{
                        position: "absolute",
                        top: "8px",
                        right: "8px"
                      }}
                    />
                  </div>
                  
                  {/* Nội dung text ở dưới */}
                  <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ 
                      fontSize: "1.1rem", 
                      fontWeight: "700", 
                      color: "#ffffff", 
                      lineHeight: "1.3",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      height: "2.6em"
                    }}>
                      {podcast.title}
                    </div>
                    
                    <div style={{ 
                      fontSize: "0.95rem", 
                      color: "#1db954", 
                      fontWeight: "600",
                      transition: "color 0.3s ease"
                    }}>
                      {podcast.host}
                    </div>
                    
                    <div 
                      style={{ 
                        fontSize: "0.85rem", 
                        color: "#999", 
                        lineHeight: "1.4",
                        display: "-webkit-box",
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        height: "5.6em",
                        transition: "all 0.3s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.WebkitLineClamp = "unset";
                        e.target.style.height = "auto";
                        e.target.style.overflow = "visible";
                        e.target.style.color = "#ccc";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.WebkitLineClamp = "4";
                        e.target.style.height = "5.6em";
                        e.target.style.overflow = "hidden";
                        e.target.style.color = "#999";
                      }}
                    >
                      {podcast.description || "Không có mô tả."}
                    </div>
                    
                    <div style={{ 
                      fontSize: "0.8rem", 
                      color: "#666", 
                      fontWeight: "600",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginTop: "auto",
                      paddingTop: "8px",
                      borderTop: "1px solid #333"
                    }}>
                      {podcast.category || 'Podcast'}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{
                padding: "40px 20px",
                textAlign: "center",
                color: "#b3b3b3",
                fontSize: 16,
                gridColumn: "1 / -1"
              }}>
                <div style={{ marginBottom: 8 }}>Chưa có podcast nào</div>
                <div style={{ fontSize: 14, opacity: 0.8 }}>
                  Admin sẽ tạo các podcast để bạn thưởng thức
                </div>
              </div>
            )}
          </div>
        </section>
        
        {/* Nghệ sĩ nổi bật */}
        <section style={{ marginTop: "2rem", padding: "1rem 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h2 style={{ color: "#fff", fontSize: "1.5rem", margin: 0 }}>Nghệ sĩ nổi bật</h2>
            <button
              onClick={() => {
                // Shuffle artists list
                const shuffled = [...artists].sort(() => Math.random() - 0.5);
                setArtists(shuffled);
              }}
              style={{
                background: "transparent",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "20px",
                color: "#b3b3b3",
                padding: "0.5rem 1rem",
                fontSize: "0.8rem",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = "#1db954";
                e.target.style.color = "#1db954";
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
                e.target.style.color = "#b3b3b3";
              }}
            >
              Làm mới
            </button>
          </div>
          
          <div style={{ 
            display: "flex", 
            flexWrap: "wrap",
            gap: "2rem",
            justifyContent: "center",
            maxWidth: "100%"
          }}>
            {Array.isArray(artists) ? artists.slice(0, 6).map((artist) => (
              <div
                key={artist._id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-8px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {/* Avatar */}
                <div 
                  style={{ marginBottom: "1rem", position: "relative", cursor: "pointer" }}
                  onClick={() => {
                    window.location.hash = `#/artist/${artist._id}`;
                  }}
                >
                  <img
                    src={withMediaBase(artist.avatar) || "https://via.placeholder.com/140x140/18181b/fff?text=Artist"}
                    alt={artist.name}
                    style={{
                      width: "140px",
                      height: "140px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "4px solid rgba(255, 255, 255, 0.1)",
                      transition: "all 0.3s ease",
                      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)"
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.borderColor = "#1db954";
                      e.target.style.transform = "scale(1.05)";
                      e.target.style.boxShadow = "0 12px 40px rgba(29, 185, 84, 0.3)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                      e.target.style.transform = "scale(1)";
                      e.target.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.3)";
                    }}
                  />
                </div>
                
                {/* Artist Info */}
                <h3 style={{ 
                  color: "#fff", 
                  fontSize: "1.2rem", 
                  fontWeight: "600", 
                  margin: "0 0 0.5rem 0",
                  maxWidth: "160px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {artist.name}
                  </span>
                  {artist.isVerified && (
                    <FaCheckCircle 
                      style={{ 
                        color: "#1db954", 
                        fontSize: "1rem",
                        flexShrink: 0,
                        filter: "drop-shadow(0 1px 2px rgba(29, 185, 84, 0.3))"
                      }} 
                      title="Nghệ sĩ đã xác minh"
                    />
                  )}
                </h3>
                
                <p style={{ 
                  color: "#b3b3b3", 
                  fontSize: "0.9rem", 
                  margin: "0 0 1rem 0",
                  fontWeight: "400"
                }}>
                  {(artist.followers || 0).toLocaleString("vi-VN")} người theo dõi
                </p>
                
                {/* Follow Button */}
                <div onClick={(e) => e.stopPropagation()}>
                  <FollowButton artist={artist} />
                </div>
              </div>
            )) : null}
          </div>
        </section>

        {/* Bảng Xếp Hạng Tuần */}
        <section style={{ marginTop: "2rem", padding: "1rem 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ color: "#fff", fontSize: "1.5rem", margin: 0 }}>Bảng Xếp Hạng Tuần</h2>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <div style={{ 
                display: "flex", 
                background: "#2a2a35", 
                borderRadius: "8px", 
                padding: "2px",
                border: "1px solid rgba(255, 255, 255, 0.1)"
              }}>
                <button
                  onClick={() => setTrendingFilter("region")}
                  style={{
                    background: trendingFilter === "region" ? "#1db954" : "transparent",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "0.5rem 1rem",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    fontWeight: "500"
                  }}
                >
                  Theo Khu Vực
                </button>
                <button
                  onClick={() => setTrendingFilter("genre")}
                  style={{
                    background: trendingFilter === "genre" ? "#1db954" : "transparent",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "0.5rem 1rem",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    fontWeight: "500"
                  }}
                >
                  Theo Thể Loại
                </button>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            {/* Việt Nam */}
            <div style={{ flex: "1", minWidth: "250px", background: "#1e1e24", padding: "1rem", borderRadius: "8px" }}>
              <h3 style={{ color: "#fff", marginBottom: "1rem" }}>
                {trendingFilter === "region" ? "Việt Nam" : "Pop"}
              </h3>
              {trendingSongs.vietnam.length > 0 ? trendingSongs.vietnam.map((song, index) => (
                <div 
                  key={song._id} 
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "0.5rem", 
                    padding: "0.5rem", 
                    borderRadius: "4px",
                    cursor: "pointer",
                    background: current && current._id === song._id ? "rgba(29, 185, 84, 0.1)" : "transparent",
                    borderBottom: "1px solid #333",
                    position: "relative"
                  }}
                  onClick={() => {
                    const realIdx = songs.findIndex((s) => s._id === song._id);
                    if (realIdx !== -1) {
                      const isCurrent = current && current._id === song._id;
                      if (isCurrent) {
                        setIsPlaying((prev) => !prev);
                      } else {
                        playSong(realIdx);
                      }
                    }
                  }}
                >
                  <span style={{ color: "#b3b3b3", minWidth: "20px" }}>{index + 1}</span>
                  <img src={withMediaBase(song.cover) || "/default-cover.png"} alt={song.title} style={{ width: "30px", height: "30px", borderRadius: "4px" }} />
                  <div style={{ flex: "1", minWidth: "0" }}>
                    <div style={{ color: "#fff", fontSize: "0.9rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.title}</div>
                    <div style={{ color: "#b3b3b3", fontSize: "0.8rem" }}>{song.artist}</div>
                  </div>
                  <button 
                    style={{ 
                      background: "transparent", 
                      border: "none", 
                      color: "#b3b3b3", 
                      cursor: "pointer", 
                      padding: "4px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      const realIdx = songs.findIndex((s) => s._id === song._id);
                      if (realIdx !== -1) {
                        const isCurrent = current && current._id === song._id;
                        if (isCurrent) {
                          setIsPlaying((prev) => !prev);
                        } else {
                          playSong(realIdx, "suggestions");
                        }
                      }
                    }}
                  >
                    {current && current._id === song._id && isPlaying ? <FaPause /> : <FaPlay />}
                  </button>
                </div>
              )) : <div style={{ color: "#b3b3b3" }}>Đang tải...</div>}
            </div>
            
            {/* US-UK */}
            <div style={{ flex: "1", minWidth: "250px", background: "#1e1e24", padding: "1rem", borderRadius: "8px" }}>
              <h3 style={{ color: "#fff", marginBottom: "1rem" }}>
                {trendingFilter === "region" ? "US-UK" : "R/B"}
              </h3>
              {trendingSongs.usuk.length > 0 ? trendingSongs.usuk.map((song, index) => (
                <div 
                  key={`us-${song._id}`} 
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "0.5rem", 
                    padding: "0.5rem", 
                    borderRadius: "4px",
                    cursor: "pointer",
                    background: current && current._id === song._id ? "rgba(29, 185, 84, 0.1)" : "transparent",
                    borderBottom: "1px solid #333"
                  }}
                  onClick={() => {
                    const realIdx = songs.findIndex((s) => s._id === song._id);
                    if (realIdx !== -1) {
                      const isCurrent = current && current._id === song._id;
                      if (isCurrent) {
                        setIsPlaying((prev) => !prev);
                      } else {
                        playSong(realIdx);
                      }
                    }
                  }}
                >
                  <span style={{ color: "#b3b3b3", minWidth: "20px" }}>{index + 1}</span>
                  <img src={withMediaBase(song.cover) || "/default-cover.png"} alt={song.title} style={{ width: "30px", height: "30px", borderRadius: "4px" }} />
                  <div style={{ flex: "1", minWidth: "0" }}>
                    <div style={{ color: "#fff", fontSize: "0.9rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.title}</div>
                    <div style={{ color: "#b3b3b3", fontSize: "0.8rem" }}>{song.artist}</div>
                  </div>
                  <button 
                    style={{ 
                      background: "transparent", 
                      border: "none", 
                      color: "#b3b3b3", 
                      cursor: "pointer", 
                      padding: "4px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      const realIdx = songs.findIndex((s) => s._id === song._id);
                      if (realIdx !== -1) {
                        const isCurrent = current && current._id === song._id;
                        if (isCurrent) {
                          setIsPlaying((prev) => !prev);
                        } else {
                          playSong(realIdx, "suggestions");
                        }
                      }
                    }}
                  >
                    {current && current._id === song._id && isPlaying ? <FaPause /> : <FaPlay />}
                  </button>
                </div>
              )) : <div style={{ color: "#b3b3b3" }}>Đang tải...</div>}
            </div>
            
            {/* K-Pop */}
            <div style={{ flex: "1", minWidth: "250px", background: "#1e1e24", padding: "1rem", borderRadius: "8px" }}>
              <h3 style={{ color: "#fff", marginBottom: "1rem" }}>
                {trendingFilter === "region" ? "K-Pop" : "Rap"}
              </h3>
              {trendingSongs.korea.length > 0 ? trendingSongs.korea.map((song, index) => (
                <div 
                  key={`k-${song._id}`} 
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "0.5rem", 
                    padding: "0.5rem", 
                    borderRadius: "4px",
                    cursor: "pointer",
                    background: current && current._id === song._id ? "rgba(29, 185, 84, 0.1)" : "transparent",
                    borderBottom: "1px solid #333"
                  }}
                  onClick={() => {
                    const realIdx = songs.findIndex((s) => s._id === song._id);
                    if (realIdx !== -1) {
                      const isCurrent = current && current._id === song._id;
                      if (isCurrent) {
                        setIsPlaying((prev) => !prev);
                      } else {
                        playSong(realIdx);
                      }
                    }
                  }}
                >
                  <span style={{ color: "#b3b3b3", minWidth: "20px" }}>{index + 1}</span>
                  <img src={withMediaBase(song.cover) || "/default-cover.png"} alt={song.title} style={{ width: "30px", height: "30px", borderRadius: "4px" }} />
                  <div style={{ flex: "1", minWidth: "0" }}>
                    <div style={{ color: "#fff", fontSize: "0.9rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.title}</div>
                    <div style={{ color: "#b3b3b3", fontSize: "0.8rem" }}>{song.artist}</div>
                  </div>
                  <button 
                    style={{ 
                      background: "transparent", 
                      border: "none", 
                      color: "#b3b3b3", 
                      cursor: "pointer", 
                      padding: "4px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      const realIdx = songs.findIndex((s) => s._id === song._id);
                      if (realIdx !== -1) {
                        const isCurrent = current && current._id === song._id;
                        if (isCurrent) {
                          setIsPlaying((prev) => !prev);
                        } else {
                          playSong(realIdx, "suggestions");
                        }
                      }
                    }}
                  >
                    {current && current._id === song._id && isPlaying ? <FaPause /> : <FaPlay />}
                  </button>
                </div>
              )) : <div style={{ color: "#b3b3b3" }}>Đang tải...</div>}
            </div>
          </div>
        </section>
        
        {/* Các thành phần khác sẽ thêm vào đây sau này */}
      </main>
      
      
      {/* GlobalPlayer renders persistently in main.jsx */}
    </div>
  );
}

export default App;
