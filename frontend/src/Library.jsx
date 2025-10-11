import React, { useState, useEffect } from 'react';
import { FaPlay, FaPause, FaMusic, FaCompactDisc, FaUser, FaHistory, FaPlus, FaEdit, FaTrash, FaHeart, FaHeartBroken, FaTimes } from 'react-icons/fa';
import { usePlayer } from './PlayerContext';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import CreatePlaylistModal from './CreatePlaylistModal';
import FollowButton from './FollowButton';
import Header from './Header';
import ConfirmationModal from './ConfirmationModal';

const Library = () => {
  const { user, isAuthenticated, updateUserFollowedArtists } = useAuth();
  const { setQueueAndPlay, setQueueContext, current, isPlaying, setIsPlaying } = usePlayer();
  const { showSuccess, showError } = useToast();
  
  // Add CSS animation for spinner
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  
  const [activeTab, setActiveTab] = useState('playlists');
  const [playlists, setPlaylists] = useState([]);
  const [followedArtists, setFollowedArtists] = useState([]);
  const [listeningHistory, setListeningHistory] = useState([]);
  const [uniqueHistory, setUniqueHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingArtists, setIsLoadingArtists] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [showPlaylistDetail, setShowPlaylistDetail] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState({
    title: "Xác nhận",
    message: "",
    confirmText: "Xác nhận",
    cancelText: "Hủy",
    type: "warning"
  });

  // Create unique history (latest play time for each song)
  useEffect(() => {
    if (listeningHistory.length > 0) {
      const uniqueMap = new Map();
      
      listeningHistory.forEach(item => {
        const songId = item.song?._id;
        if (songId) {
          if (!uniqueMap.has(songId) || new Date(item.playedAt) > new Date(uniqueMap.get(songId).playedAt)) {
            uniqueMap.set(songId, item);
          }
        }
      });
      
      const uniqueArray = Array.from(uniqueMap.values())
        .sort((a, b) => new Date(b.playedAt) - new Date(a.playedAt));
      
      setUniqueHistory(uniqueArray);
    } else {
      setUniqueHistory([]);
    }
  }, [listeningHistory]);

  // Load user's library data
  useEffect(() => {
    if (isAuthenticated && user) {
      loadLibraryData();
    }
  }, [isAuthenticated, user]);

  // Listen for playlist updates from other components
  useEffect(() => {
    const handlePlaylistUpdate = () => {
      if (isAuthenticated && user) {
        loadLibraryData();
      }
    };

    window.addEventListener('playlistUpdated', handlePlaylistUpdate);
    return () => window.removeEventListener('playlistUpdated', handlePlaylistUpdate);
  }, [isAuthenticated, user]);

  // Listen for follow status changes
  useEffect(() => {
    const handleFollowStatusChange = () => {
      if (isAuthenticated && user) {
        loadFollowedArtists();
      }
    };

    const handleUserLoggedOut = () => {
      setFollowedArtists([]);
      setPlaylists([]);
      setListeningHistory([]);
      setUniqueHistory([]);
    };

    window.addEventListener('followStatusChanged', handleFollowStatusChange);
    window.addEventListener('userLoggedOut', handleUserLoggedOut);
    
    return () => {
      window.removeEventListener('followStatusChanged', handleFollowStatusChange);
      window.removeEventListener('userLoggedOut', handleUserLoggedOut);
    };
  }, [isAuthenticated, user]);

  // Update selectedPlaylist when playlists data changes
  useEffect(() => {
    if (showPlaylistDetail && selectedPlaylist && playlists.length > 0) {
      const updatedSelectedPlaylist = playlists.find(p => p._id === selectedPlaylist._id);
      if (updatedSelectedPlaylist) {
        setSelectedPlaylist(updatedSelectedPlaylist);
      }
    }
  }, [playlists, showPlaylistDetail]);

  // Load followed artists from user data
  useEffect(() => {
    if (isAuthenticated && user) {
      loadFollowedArtists();
    } else {
      setFollowedArtists([]);
    }
  }, [isAuthenticated, user?._id]); // Use user._id to detect user changes

  const loadLibraryData = async () => {
    setIsLoading(true);
    try {
      const token = user?.token;
      const headers = { 'Authorization': `Bearer ${token}` };

      // Load user playlists
      const playlistsRes = await fetch('http://localhost:5000/api/user-playlists', { headers });
      const playlistsData = await playlistsRes.json();
      setPlaylists(playlistsData);


      // Load listening history
      const historyRes = await fetch('http://localhost:5000/api/history', { headers });
      const historyData = await historyRes.json();
      setListeningHistory(historyData.history || []);

    } catch (error) {
      console.error('Error loading library data:', error);
      showError('Lỗi khi tải dữ liệu thư viện');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFollowedArtists = async () => {
    if (!isAuthenticated || !user?.token) {
      setFollowedArtists([]);
      return;
    }

    setIsLoadingArtists(true);
    try {
      const token = user?.token;
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Load all followed artists in one request
      const response = await fetch('http://localhost:5000/api/artists/followed', { headers });
      
      if (response.ok) {
        const artists = await response.json();
        setFollowedArtists(artists || []);
      } else {
        console.error('Failed to load followed artists:', response.status);
        setFollowedArtists([]);
      }
      
    } catch (error) {
      console.error('Error loading followed artists:', error);
      showError('Lỗi khi tải danh sách nghệ sĩ đã theo dõi');
      setFollowedArtists([]);
    } finally {
      setIsLoadingArtists(false);
    }
  };

  const handlePlayPlaylist = async (playlist) => {
    try {
      const token = user?.token;
      const response = await fetch(`http://localhost:5000/api/user-playlists/${playlist._id}/songs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const playlistData = await response.json();
      const songs = playlistData.songs || [];
      
      if (songs.length > 0) {
        setQueueAndPlay(songs, 0);
        setQueueContext('playlist');
        showSuccess(`Đang phát playlist: ${playlist.name}`);
      } else {
        showError('Playlist trống');
      }
    } catch (error) {
      console.error('Error playing playlist:', error);
      showError('Lỗi khi phát playlist');
    }
  };

  const handlePlaySong = async (song) => {
    try {
      // If song is from playlist, use the playlist songs as queue
      if (selectedPlaylist && selectedPlaylist.songs) {
        const songIndex = selectedPlaylist.songs.findIndex(s => s._id === song._id);
        if (songIndex !== -1) {
          setQueueAndPlay(selectedPlaylist.songs, songIndex);
          setQueueContext('playlist');
          return;
        }
      }
      
      // Fallback: fetch all songs
      const response = await fetch('http://localhost:5000/api/songs');
      const allSongs = await response.json();
      const songIndex = allSongs.findIndex(s => s._id === song._id);
      
      if (songIndex !== -1) {
        setQueueAndPlay(allSongs, songIndex);
        setQueueContext('library');
      }
    } catch (error) {
      console.error('Error playing song:', error);
      showError('Lỗi khi phát bài hát');
    }
  };


  const handleDeletePlaylist = async (playlistId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/user-playlists/${playlistId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });

      if (response.ok) {
        showSuccess('Đã xóa playlist thành công');
        loadLibraryData(); // Reload data
      } else {
        showError('Không thể xóa playlist');
      }
    } catch (error) {
      showError('Lỗi khi xóa playlist');
    }
  };

  const handleViewPlaylist = async (playlist) => {
    try {
      const response = await fetch(`http://localhost:5000/api/user-playlists/${playlist._id}/songs`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });
      
      if (response.ok) {
        const playlistWithSongs = await response.json();
        setSelectedPlaylist(playlistWithSongs);
        setShowPlaylistDetail(true);
      } else {
        showError('Không thể tải danh sách bài hát');
      }
    } catch (error) {
      showError('Lỗi khi tải playlist');
    }
  };

  const handleRemoveSongFromPlaylist = async (playlistId, songId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/user-playlists/${playlistId}/songs/${songId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });

      if (response.ok) {
        showSuccess('Đã xóa bài hát khỏi playlist');
        // Reload playlist detail
        handleViewPlaylist(selectedPlaylist);
      } else {
        showError('Không thể xóa bài hát');
      }
    } catch (error) {
      showError('Lỗi khi xóa bài hát');
    }
  };

  const handleClearHistory = () => {
    setConfirmAction(() => async () => {
      try {
        const response = await fetch('http://localhost:5000/api/history', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${user?.token}`
          }
        });

        if (response.ok) {
          showSuccess('Đã xóa toàn bộ lịch sử nghe nhạc');
          setListeningHistory([]);
          setUniqueHistory([]);
        } else {
          showError('Không thể xóa lịch sử nghe nhạc');
        }
      } catch (error) {
        showError('Lỗi khi xóa lịch sử nghe nhạc');
      }
    });
    setConfirmConfig({
      title: "Xóa lịch sử nghe nhạc",
      message: "Bạn có chắc chắn muốn xóa toàn bộ lịch sử nghe nhạc? Hành động này không thể hoàn tác.",
      confirmText: "Xóa hết",
      cancelText: "Hủy",
      type: "danger"
    });
    setShowConfirmModal(true);
  };


  const handleCreatePlaylistSuccess = (newPlaylist) => {
    // Reload data to ensure consistency
    loadLibraryData();
    
    if (editingPlaylist) {
      // Update selectedPlaylist if it's the same playlist being edited
      if (selectedPlaylist && selectedPlaylist._id === editingPlaylist._id) {
        setSelectedPlaylist(newPlaylist);
      }
    }
  };

  const withMediaBase = (p) => (p && p.startsWith("/uploads") ? `http://localhost:5000${p}` : p);

  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        color: 'white',
        padding: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <FaMusic size="4rem" style={{ color: '#1db954', marginBottom: '1rem' }} />
          <h2>Vui lòng đăng nhập để sử dụng thư viện</h2>
          <p style={{ color: '#b3b3b3', marginTop: '0.5rem' }}>
            Đăng nhập để tạo playlist, theo dõi nghệ sĩ và xem lịch sử nghe nhạc
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        color: 'white',
        padding: '2rem',
        paddingTop: '6rem', // Thêm padding-top để tránh bị header che
        marginBottom: '120px'
      }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Thư viện của bạn
          </h1>
          <p style={{ color: '#b3b3b3', fontSize: '1.1rem' }}>
            Quản lý playlist, nghệ sĩ yêu thích và lịch sử nghe nhạc
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '2rem',
          marginBottom: '2rem',
          borderBottom: '1px solid #333'
        }}>
          {[
            { id: 'playlists', label: 'Playlists', icon: FaMusic },
            { id: 'artists', label: 'Nghệ sĩ', icon: FaUser },
            { id: 'history', label: 'Lịch sử', icon: FaHistory }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '1rem 0',
                  background: 'none',
                  border: 'none',
                  color: activeTab === tab.id ? '#1db954' : '#b3b3b3',
                  fontSize: '1.1rem',
                  fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                  cursor: 'pointer',
                  borderBottom: activeTab === tab.id ? '2px solid #1db954' : '2px solid transparent',
                  transition: 'all 0.3s ease'
                }}
              >
                <Icon size="1.2rem" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div style={{ color: '#1db954', fontSize: '2rem' }}>Đang tải...</div>
          </div>
        ) : (
          <>
            {/* Playlists Tab */}
            {activeTab === 'playlists' && (
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '2rem'
                }}>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>Playlists của bạn</h2>
                  <button
                    onClick={() => setShowCreatePlaylist(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      background: '#1db954',
                      color: 'white',
                      border: 'none',
                      borderRadius: '25px',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#1ed760'}
                    onMouseLeave={(e) => e.target.style.background = '#1db954'}
                  >
                    <FaPlus size="1rem" />
                    Tạo playlist
                  </button>
                </div>

                {playlists.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '4rem',
                    color: '#b3b3b3'
                  }}>
                    <FaMusic size="3rem" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <h3>Chưa có playlist nào</h3>
                    <p>Tạo playlist đầu tiên của bạn để lưu trữ những bài hát yêu thích</p>
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '1.5rem'
                  }}>
                    {playlists.filter(playlist => playlist && playlist._id).map(playlist => (
                      <div
                        key={playlist._id}
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '12px',
                          padding: '1rem',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          position: 'relative'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(255, 255, 255, 0.06)';
                          e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                          e.target.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'rgba(255, 255, 255, 0.03)';
                          e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                          e.target.style.transform = 'translateY(0)';
                        }}
                        onClick={() => handleViewPlaylist(playlist)}
                      >
                        <div style={{
                          width: '100%',
                          aspectRatio: '1',
                          borderRadius: '8px',
                          marginBottom: '1rem',
                          position: 'relative',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'linear-gradient(135deg, #1db954 0%, #1ed760 100%)'
                        }}>
                          {playlist.cover ? (
                            <img 
                              src={withMediaBase(playlist.cover)}
                              alt={playlist.name}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: '8px'
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <FaMusic size="2rem" color="white" style={{ opacity: 0.8 }} />
                          )}
                          
                          {/* Play button */}
                          <div style={{
                            position: 'absolute',
                            bottom: '8px',
                            right: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            opacity: 0
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.opacity = '1';
                            e.target.style.transform = 'scale(1.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.opacity = '0';
                            e.target.style.transform = 'scale(1)';
                          }}
                        >
                          <FaPlay size="1.2rem" />
                        </div>
                        
                        {/* Edit button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingPlaylist(playlist);
                            setShowCreatePlaylist(true);
                          }}
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            background: 'none',
                            border: 'none',
                            color: 'rgba(255, 255, 255, 0.6)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.3s ease',
                            zIndex: 10,
                            opacity: 0,
                            transform: 'scale(0.8)',
                            padding: '4px'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'scale(1)';
                            e.target.style.opacity = '1';
                            e.target.style.color = '#fff';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'scale(0.8)';
                            e.target.style.opacity = '0';
                            e.target.style.color = 'rgba(255, 255, 255, 0.6)';
                          }}
                          title="Chỉnh sửa playlist"
                        >
                          <FaEdit size="1rem" />
                        </button>
                        
                        {/* Delete button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmAction(() => () => {
                              handleDeletePlaylist(playlist._id);
                            });
                            setConfirmConfig({
                              title: "Xóa playlist",
                              message: `Bạn có chắc muốn xóa playlist "${playlist.name}"?`,
                              confirmText: "Xóa",
                              cancelText: "Hủy",
                              type: "danger"
                            });
                            setShowConfirmModal(true);
                          }}
                          style={{
                            position: 'absolute',
                            top: '8px',
                            left: '8px',
                            background: 'none',
                            border: 'none',
                            color: 'rgba(255, 255, 255, 0.6)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.3s ease',
                            zIndex: 10,
                            opacity: 0,
                            transform: 'scale(0.8)',
                            padding: '4px'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'scale(1)';
                            e.target.style.opacity = '1';
                            e.target.style.color = '#fff';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'scale(0.8)';
                            e.target.style.opacity = '0';
                            e.target.style.color = 'rgba(255, 255, 255, 0.6)';
                          }}
                          title="Xóa playlist"
                        >
                          <FaTimes size="1rem" />
                        </button>
                      </div>
                      
                      <div>
                        <h3 style={{
                          fontSize: '1.1rem',
                          fontWeight: 'bold',
                          marginBottom: '0.25rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {playlist.name}
                        </h3>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginBottom: '0.5rem',
                          minHeight: '1.2rem'
                        }}>
                          {playlist.description && (
                            <p style={{
                              color: '#b3b3b3',
                              fontSize: '0.8rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              margin: 0,
                              maxWidth: 'calc(100% - 3rem)' // Reserve space for song count
                            }}>
                              {playlist.description}
                            </p>
                          )}
                          <p style={{
                            color: '#b3b3b3',
                            fontSize: '0.8rem',
                            margin: 0,
                            flexShrink: 0,
                            minWidth: '2.5rem',
                            textAlign: 'right'
                          }}>
                            {playlist.songs?.length || 0} bài
                          </p>
                        </div>
                      </div>
                    </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Artists Tab */}
            {activeTab === 'artists' && (
              <div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '2rem' }}>
                  Nghệ sĩ đã theo dõi
                </h2>

                {isLoadingArtists ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '4rem',
                    color: '#b3b3b3'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      border: '3px solid rgba(29, 185, 84, 0.3)',
                      borderTop: '3px solid #1db954',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto 1rem'
                    }} />
                    <h3>Đang tải danh sách nghệ sĩ...</h3>
                  </div>
                ) : followedArtists.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '4rem',
                    color: '#b3b3b3'
                  }}>
                    <FaUser size="3rem" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <h3>Chưa theo dõi nghệ sĩ nào</h3>
                    <p>Khám phá và theo dõi những nghệ sĩ yêu thích của bạn</p>
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '1.5rem'
                  }}>
                    {followedArtists.map(artist => (
                      <div
                        key={artist._id}
                        style={{
                          background: 'transparent',
                          borderRadius: '12px',
                          padding: '1rem',
                          transition: 'all 0.3s ease',
                          position: 'relative',
                          cursor: 'pointer',
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.borderColor = 'rgba(29, 185, 84, 0.5)';
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 4px 12px rgba(29, 185, 84, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = 'none';
                        }}
                        onClick={() => {
                          window.location.hash = `#/artist/${encodeURIComponent(artist._id)}`;
                        }}
                      >
                        <div style={{
                          width: '100%',
                          aspectRatio: '1',
                          borderRadius: '50%',
                          marginBottom: '1rem',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(255, 255, 255, 0.1)'
                        }}>
                          <img
                            src={withMediaBase(artist.avatar) || '/default-avatar.png'}
                            alt={artist.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              borderRadius: '50%'
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.style.background = 'linear-gradient(135deg, #1db954, #1ed760)';
                              e.target.parentElement.innerHTML = `<div style="color: white; font-size: 2rem; font-weight: bold;">${artist.name.charAt(0).toUpperCase()}</div>`;
                            }}
                          />
                        </div>
                        
                        <div>
                          <h3 style={{
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            marginBottom: '0.25rem',
                            textAlign: 'center'
                          }}>
                            {artist.name}
                          </h3>
                          <p style={{
                            color: '#b3b3b3',
                            fontSize: '0.9rem',
                            textAlign: 'center',
                            marginBottom: '1rem'
                          }}>
                            {(artist.followers || 0).toLocaleString("vi-VN")} người theo dõi
                          </p>
                          
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <FollowButton 
                              artist={artist}
                              isFollowing={true}
                              onFollowChange={(artistId, isFollowing) => {
                                if (!isFollowing) {
                                  // Remove from local state when unfollowed
                                  setFollowedArtists(prev => prev.filter(a => a._id !== artistId));
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}


            {/* History Tab */}
            {activeTab === 'history' && (
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '2rem'
                }}>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0 }}>
                    Lịch sử nghe nhạc
                  </h2>
                  {uniqueHistory.length > 0 && (
                    <button
                      onClick={handleClearHistory}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '25px',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#c82333'}
                      onMouseLeave={(e) => e.target.style.background = '#dc3545'}
                    >
                      <FaTrash size="1rem" />
                      Xóa hết lịch sử
                    </button>
                  )}
                </div>

                {uniqueHistory.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '4rem',
                    color: '#b3b3b3'
                  }}>
                    <FaHistory size="3rem" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <h3>Chưa có lịch sử nghe nhạc</h3>
                    <p>Bắt đầu nghe nhạc để xem lịch sử của bạn</p>
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem'
                  }}>
                    {(uniqueHistory || []).map((item, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.5rem 0',
                          cursor: 'pointer',
                          transition: 'opacity 0.3s ease',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.opacity = '0.7';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.opacity = '1';
                        }}
                        onClick={() => item.song && handlePlaySong(item.song)}
                      >
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '6px',
                          background: `url(${withMediaBase(item.song?.cover) || '/default-cover.png'}) center/cover`,
                          flexShrink: 0
                        }} />
                        
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            marginBottom: '0.15rem',
                            color: 'white',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {item.song?.title || 'Unknown Song'}
                          </h4>
                          <p style={{
                            color: '#b3b3b3',
                            fontSize: '0.85rem',
                            margin: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {item.song?.artist || 'Unknown Artist'}
                          </p>
                        </div>
                        
                        <div style={{
                          color: '#b3b3b3',
                          fontSize: '0.8rem',
                          flexShrink: 0,
                          textAlign: 'right'
                        }}>
                          {new Date(item.playedAt).toLocaleString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </div>
                        
                        <button
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#1db954',
                            cursor: 'pointer',
                            opacity: 0,
                            transition: 'opacity 0.3s ease'
                          }}
                          onMouseEnter={(e) => e.target.style.opacity = '1'}
                        >
                          <FaPlay size="1rem" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Playlist Detail Modal */}
      {showPlaylistDetail && selectedPlaylist && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#1a1a1a',
            borderRadius: '12px',
            padding: '1.5rem',
            maxWidth: '700px',
            width: '95%',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Header with playlist info */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1rem',
              flexShrink: 0
            }}>
              {/* Playlist cover */}
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '8px',
                background: selectedPlaylist.cover 
                  ? `url(${withMediaBase(selectedPlaylist.cover)}) center/cover`
                  : 'linear-gradient(135deg, #1db954 0%, #1ed760 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {!selectedPlaylist.cover && (
                  <FaMusic size="1.8rem" color="white" style={{ opacity: 0.8 }} />
                )}
              </div>
              
              {/* Playlist info */}
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.5rem'
                }}>
                  <h2 style={{ 
                    fontSize: '1.4rem', 
                    fontWeight: 'bold',
                    margin: 0,
                    marginBottom: '0.25rem'
                  }}>
                    {selectedPlaylist.name}
                  </h2>
                  <button
                    onClick={() => {
                      setShowPlaylistDetail(false);
                      setSelectedPlaylist(null);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#b3b3b3',
                      fontSize: '1.5rem',
                      cursor: 'pointer',
                      padding: '0.5rem',
                      transition: 'color 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.color = '#b3b3b3';
                    }}
                  >
                    <FaTimes />
                  </button>
                </div>
                
                <p style={{ 
                  color: '#b3b3b3', 
                  fontSize: '0.9rem',
                  margin: 0,
                  marginBottom: '0.25rem'
                }}>
                  {selectedPlaylist.songs?.length || 0} bài hát
                </p>
                
                {selectedPlaylist.description && (
                  <p style={{ 
                    color: '#b3b3b3', 
                    fontSize: '0.8rem',
                    margin: 0,
                    fontStyle: 'italic'
                  }}>
                    {selectedPlaylist.description}
                  </p>
                )}
              </div>
            </div>

            {/* Play all button */}
            <div style={{ marginBottom: '1rem', flexShrink: 0 }}>
              <button
                onClick={() => {
                  handlePlayPlaylist(selectedPlaylist);
                  setShowPlaylistDetail(false);
                  setSelectedPlaylist(null);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  background: '#1db954',
                  color: 'white',
                  border: 'none',
                  borderRadius: '25px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.background = '#1ed760'}
                onMouseLeave={(e) => e.target.style.background = '#1db954'}
              >
                <FaPlay size="0.8rem" />
                Phát tất cả
              </button>
            </div>

            {/* Songs list */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <h3 style={{ 
                marginBottom: '0.5rem',
                fontSize: '1rem',
                fontWeight: 'bold',
                flexShrink: 0
              }}>
                Danh sách bài hát
              </h3>
              
              {selectedPlaylist.songs && selectedPlaylist.songs.length > 0 ? (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '0.25rem',
                  flex: 1,
                  overflowY: 'auto',
                  paddingRight: '0.5rem',
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(255, 255, 255, 0.3) transparent',
                  minHeight: 0
                }}>
                  {(selectedPlaylist.songs || []).filter(song => song && song._id).map((song, index) => (
                    <div
                      key={song._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.5rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        borderBottom: index < selectedPlaylist.songs.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.opacity = '0.7';
                        // Show delete button
                        const deleteBtn = e.target.querySelector('button');
                        if (deleteBtn) {
                          deleteBtn.style.opacity = '1';
                          deleteBtn.style.transform = 'scale(1)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.opacity = '1';
                        // Hide delete button
                        const deleteBtn = e.target.querySelector('button');
                        if (deleteBtn) {
                          deleteBtn.style.opacity = '0';
                          deleteBtn.style.transform = 'scale(0.8)';
                        }
                      }}
                      onClick={() => handlePlaySong(song)}
                    >
                      {/* Song number */}
                      <div style={{
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#b3b3b3',
                        fontSize: '0.85rem',
                        fontWeight: '500',
                        flexShrink: 0
                      }}>
                        {index + 1}
                      </div>
                      
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '4px',
                        background: `url(${withMediaBase(song.cover) || '/default-cover.png'}) center/cover`,
                        flexShrink: 0
                      }} />
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{
                          fontSize: '0.9rem',
                          fontWeight: 'bold',
                          marginBottom: '0.1rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {song.title}
                        </h4>
                        <p style={{
                          color: '#b3b3b3',
                          fontSize: '0.8rem',
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {song.artist}
                        </p>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmAction(() => () => {
                            handleRemoveSongFromPlaylist(selectedPlaylist._id, song._id);
                          });
                          setConfirmConfig({
                            title: "Xóa bài hát",
                            message: `Bạn có chắc muốn xóa "${song.title}" khỏi playlist?`,
                            confirmText: "Xóa",
                            cancelText: "Hủy",
                            type: "danger"
                          });
                          setShowConfirmModal(true);
                        }}
                        style={{
                          background: 'rgba(255, 0, 0, 0.1)',
                          border: '1px solid rgba(255, 0, 0, 0.3)',
                          color: '#ff4444',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.3s ease',
                          opacity: 0,
                          transform: 'scale(0.8)',
                          padding: '6px',
                          borderRadius: '4px',
                          width: '28px',
                          height: '28px'
                        }}
                        title="Xóa khỏi playlist"
                      >
                        <FaTimes size="0.8rem" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#b3b3b3', textAlign: 'center', padding: '2rem' }}>
                  Playlist trống
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Playlist Modal */}
      <CreatePlaylistModal
        isOpen={showCreatePlaylist}
        onClose={() => {
          setShowCreatePlaylist(false);
          setEditingPlaylist(null);
        }}
        onSuccess={handleCreatePlaylistSuccess}
        editingPlaylist={editingPlaylist}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmAction}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        type={confirmConfig.type}
      />
      </div>
    </div>
  );
};

export default Library;
