import { useEffect, useRef, useState } from "react";
import "./App.css";
import { FaPlay, FaPause, FaCheckCircle } from "react-icons/fa";
import { usePlayer } from "./PlayerContext.jsx";
import Header from "./Header.jsx";

function App() {
  const [songs, setSongs] = useState([]);
  const [albums, setAlbums] = useState([]);
  const withMediaBase = (p) => (p && p.startsWith("/uploads") ? `http://localhost:5000${p}` : p);
  const { setQueueAndPlay, currentIdx, isPlaying, setIsPlaying, queue, setCurrentIdx, current, setQueueContext, setQueue } = usePlayer();
  const [displayedSongs, setDisplayedSongs] = useState([]); // 7 bài hát hiển thị
  const [displayedAlbums, setDisplayedAlbums] = useState([]); // 7 album hiển thị
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
  const [searchHistory, setSearchHistory] = useState([]);

  // Load search history from localStorage
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('cs_search_history');
      if (savedHistory) {
        const history = JSON.parse(savedHistory);
        if (Array.isArray(history)) {
          setSearchHistory(history);
        }
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  }, []);

  // Save search history to localStorage
  const saveSearchHistory = (history) => {
    try {
      localStorage.setItem('cs_search_history', JSON.stringify(history));
      setSearchHistory(history);
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  };

  // Add song to search history
  const addToSearchHistory = (song) => {
    const newHistory = searchHistory.filter(item => item._id !== song._id);
    newHistory.unshift(song);
    const limitedHistory = newHistory.slice(0, 10); // Keep only 10 recent searches
    saveSearchHistory(limitedHistory);
  };

  // Remove song from search history
  const removeFromSearchHistory = (songId) => {
    const newHistory = searchHistory.filter(item => item._id !== songId);
    saveSearchHistory(newHistory);
  };

  // Clear all search history
  const clearSearchHistory = () => {
    saveSearchHistory([]);
  };

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
    Promise.all([
      fetch("http://localhost:5000/api/songs").then((r) => r.json()),
      fetch("http://localhost:5000/api/albums").then((r) => r.json()),
      fetch("http://localhost:5000/api/genres").then((r) => r.json()),
      fetch("http://localhost:5000/api/artists").then((r) => r.json()),
    ]).then(([songsData, albumsData, genresData, artistsData]) => {
      setSongs(songsData);
      setAlbums(albumsData);
      setGenres(genresData);
      setArtists(artistsData);
      setDisplayedSongs(getRandomSongs(songsData, 7));
      setDisplayedAlbums(getRandomAlbums(albumsData, 7));

      // Check for search query in URL
      const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
      const searchParam = urlParams.get('search');
      if (searchParam) {
        setSearchQuery(searchParam);
        // Clear the URL parameter after setting the search
        window.location.hash = '#/';
      }
    });
  }, []);

  // Load trending songs by region or genre
  useEffect(() => {
    const loadTrendingSongs = async () => {
      try {
        if (trendingFilter === "region") {
          // Load by region (existing logic)
          const [vietnamResponse, usukResponse, koreaResponse] = await Promise.all([
            fetch("http://localhost:5000/api/songs/trending/vietnam?limit=5").catch(() => null),
            fetch("http://localhost:5000/api/songs/trending/us-uk?limit=5").catch(() => null),
            fetch("http://localhost:5000/api/songs/trending/korea?limit=5").catch(() => null)
          ]);

          let vietnamData = [], usukData = [], koreaData = [];

          if (vietnamResponse && vietnamResponse.ok) {
            vietnamData = await vietnamResponse.json();
          }
          if (usukResponse && usukResponse.ok) {
            usukData = await usukResponse.json();
          }
          if (koreaResponse && koreaResponse.ok) {
            koreaData = await koreaResponse.json();
          }

          // Local filtering by region
          const vietnamSongs = songs.filter(song => 
            song.region && song.region.name && (
              song.region.name.toLowerCase().includes('vietnam') ||
              song.region.name.toLowerCase().includes('việt nam') ||
              song.region.name.toLowerCase().includes('viet nam')
            )
          ).sort((a, b) => {
            if (b.weeklyPlays !== a.weeklyPlays) return (b.weeklyPlays || 0) - (a.weeklyPlays || 0);
            if (b.plays !== a.plays) return (b.plays || 0) - (a.plays || 0);
            return new Date(b.createdAt) - new Date(a.createdAt);
          });
          
          const usukSongs = songs.filter(song => 
            song.region && song.region.name && (
              song.region.name.toLowerCase().includes('us') || 
              song.region.name.toLowerCase().includes('uk') ||
              song.region.name.toLowerCase().includes('america') ||
              song.region.name.toLowerCase().includes('britain') ||
              song.region.name.toLowerCase().includes('âu mỹ') ||
              song.region.name.toLowerCase().includes('au my') ||
              song.region.name.toLowerCase().includes('mỹ') ||
              song.region.name.toLowerCase().includes('anh')
            )
          ).sort((a, b) => {
            if (b.weeklyPlays !== a.weeklyPlays) return (b.weeklyPlays || 0) - (a.weeklyPlays || 0);
            if (b.plays !== a.plays) return (b.plays || 0) - (a.plays || 0);
            return new Date(b.createdAt) - new Date(a.createdAt);
          });
          
          const koreaSongs = songs.filter(song => 
            song.region && song.region.name && (
              song.region.name.toLowerCase().includes('korea') ||
              song.region.name.toLowerCase().includes('k-pop') ||
              song.region.name.toLowerCase().includes('kpop') ||
              song.region.name.toLowerCase().includes('hàn quốc') ||
              song.region.name.toLowerCase().includes('han quoc')
            )
          ).sort((a, b) => {
            if (b.weeklyPlays !== a.weeklyPlays) return (b.weeklyPlays || 0) - (a.weeklyPlays || 0);
            if (b.plays !== a.plays) return (b.plays || 0) - (a.plays || 0);
            return new Date(b.createdAt) - new Date(a.createdAt);
          });

          setTrendingSongs({
            vietnam: (vietnamData && vietnamData.length > 0) ? vietnamData : vietnamSongs.slice(0, 5),
            usuk: (usukData && usukData.length > 0) ? usukData : usukSongs.slice(0, 5),
            korea: (koreaData && koreaData.length > 0) ? koreaData : koreaSongs.slice(0, 5)
          });

        } else if (trendingFilter === "genre") {
          // Load by genre - fixed genres: Pop, R/B, Rap
          const fixedGenres = ["Pop", "R/B", "Rap"];
          const genrePromises = fixedGenres.map(genre => 
            fetch(`http://localhost:5000/api/songs/trending/genre/${encodeURIComponent(genre)}?limit=5`).catch(() => null)
          );

          const genreResponses = await Promise.all(genrePromises);
          const genreData = await Promise.all(
            genreResponses.map(response => 
              response && response.ok ? response.json() : []
            )
          );

          // Local filtering by genre as fallback
          const genreSongs = fixedGenres.map(genre => 
            songs.filter(song => 
              song.genres && song.genres.some(g => 
                g.name && g.name.toLowerCase().includes(genre.toLowerCase())
              )
            ).sort((a, b) => {
              if (b.weeklyPlays !== a.weeklyPlays) return (b.weeklyPlays || 0) - (a.weeklyPlays || 0);
              if (b.plays !== a.plays) return (b.plays || 0) - (a.plays || 0);
              return new Date(b.createdAt) - new Date(a.createdAt);
            }).slice(0, 5)
          );

          // Map to trendingSongs structure
          setTrendingSongs({
            vietnam: genreData[0] && genreData[0].length > 0 ? genreData[0] : genreSongs[0] || [],
            usuk: genreData[1] && genreData[1].length > 0 ? genreData[1] : genreSongs[1] || [],
            korea: genreData[2] && genreData[2].length > 0 ? genreData[2] : genreSongs[2] || []
          });
        }

      } catch (error) {
        console.log('Error loading trending songs:', error);
        // Fallback to local filtering
        if (trendingFilter === "region") {
          const vietnamSongs = songs.filter(song => 
            song.region && song.region.name && song.region.name.toLowerCase().includes('vietnam')
          ).sort((a, b) => {
            if (b.weeklyPlays !== a.weeklyPlays) return (b.weeklyPlays || 0) - (a.weeklyPlays || 0);
            if (b.plays !== a.plays) return (b.plays || 0) - (a.plays || 0);
            return new Date(b.createdAt) - new Date(a.createdAt);
          });
          const usukSongs = songs.filter(song => 
            song.region && song.region.name && (
              song.region.name.toLowerCase().includes('us') || 
              song.region.name.toLowerCase().includes('uk')
            )
          ).sort((a, b) => {
            if (b.weeklyPlays !== a.weeklyPlays) return (b.weeklyPlays || 0) - (a.weeklyPlays || 0);
            if (b.plays !== a.plays) return (b.plays || 0) - (a.plays || 0);
            return new Date(b.createdAt) - new Date(a.createdAt);
          });
          const koreaSongs = songs.filter(song => 
            song.region && song.region.name && song.region.name.toLowerCase().includes('korea')
          ).sort((a, b) => {
            if (b.weeklyPlays !== a.weeklyPlays) return (b.weeklyPlays || 0) - (a.weeklyPlays || 0);
            if (b.plays !== a.plays) return (b.plays || 0) - (a.plays || 0);
            return new Date(b.createdAt) - new Date(a.createdAt);
          });

          setTrendingSongs({
            vietnam: vietnamSongs.slice(0, 5),
            usuk: usukSongs.slice(0, 5),
            korea: koreaSongs.slice(0, 5)
          });
        }
      }
    };

    if (songs.length > 0) {
      loadTrendingSongs();
    }
  }, [songs, trendingFilter]); // Removed displayedSongs dependency to avoid random data

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
      const response = await fetch(`http://localhost:5000/api/artists/${artistId}/follow`, {
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
    fetch(`http://localhost:5000/api/songs/${id}/play`, { method: "POST" })
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
                        fetch("http://localhost:5000/api/songs")
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
                            fetch("http://localhost:5000/api/songs")
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
                >
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
              >
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
              <a key={al._id} href={`#/album/${encodeURIComponent(al._id)}`} className="recommend-horizontal-card" style={{ textDecoration: "none", color: "inherit" }}>
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
        
        {/* Bảng Xếp Hạng Tuần */}
        <section style={{ marginTop: "0", padding: "1rem 0" }}>
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
            {artists.slice(0, 6).map((artist) => (
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
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFollowArtist(artist._id);
                  }}
                  style={{
                    background: followedArtists.has(artist._id) ? "rgba(29, 185, 84, 0.2)" : "transparent",
                    border: `2px solid ${followedArtists.has(artist._id) ? "rgba(29, 185, 84, 0.6)" : "rgba(255, 255, 255, 0.3)"}`,
                    borderRadius: "25px",
                    color: followedArtists.has(artist._id) ? "#1db954" : "#fff",
                    padding: "0.6rem 1.8rem",
                    fontSize: "0.9rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    minWidth: "120px",
                    boxShadow: followedArtists.has(artist._id) ? "0 2px 8px rgba(29, 185, 84, 0.15)" : "none"
                  }}
                  onMouseEnter={(e) => {
                    if (!followedArtists.has(artist._id)) {
                      e.target.style.borderColor = "#1db954";
                      e.target.style.color = "#1db954";
                      e.target.style.background = "rgba(29, 185, 84, 0.05)";
                    } else {
                      e.target.style.transform = "scale(1.05)";
                      e.target.style.background = "rgba(29, 185, 84, 0.3)";
                      e.target.style.borderColor = "rgba(29, 185, 84, 0.8)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!followedArtists.has(artist._id)) {
                      e.target.style.borderColor = "rgba(255, 255, 255, 0.3)";
                      e.target.style.color = "#fff";
                      e.target.style.background = "transparent";
                    } else {
                      e.target.style.transform = "scale(1)";
                      e.target.style.background = "rgba(29, 185, 84, 0.2)";
                      e.target.style.borderColor = "rgba(29, 185, 84, 0.6)";
                    }
                  }}
                >
                  {followedArtists.has(artist._id) ? "Đang theo dõi" : "Theo dõi"}
                </button>
              </div>
            ))}
          </div>
        </section>
        
        {/* Các thành phần khác sẽ thêm vào đây sau này */}
      </main>
      {/* GlobalPlayer renders persistently in main.jsx */}
    </div>
  );
}

export default App;
