import React, { useState, useEffect } from 'react';
import { FaTimes, FaPlus, FaMusic } from 'react-icons/fa';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const AddToPlaylistModal = ({ isOpen, onClose, song, onSuccess }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  
  // Debug song object
  useEffect(() => {
    if (song) {
      console.log('AddToPlaylistModal - song object:', song);
      console.log('AddToPlaylistModal - song.cover:', song.cover);
      console.log('AddToPlaylistModal - full image URL:', song.cover ? `http://localhost:5000${song.cover}` : 'No cover');
    }
  }, [song]);
  
  const [playlists, setPlaylists] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('');

  // Load user's playlists
  useEffect(() => {
    if (isOpen && user?.token) {
      loadPlaylists();
    }
  }, [isOpen, user?.token]);

  const loadPlaylists = async () => {
    try {
      const token = user?.token;
      const response = await fetch('http://localhost:5000/api/user-playlists', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setPlaylists(data || []);
    } catch (error) {
      console.error('Error loading playlists:', error);
      showError('Lỗi khi tải danh sách playlist');
    }
  };

  const handleAddToPlaylist = async () => {
    if (!selectedPlaylistId) {
      showError('Vui lòng chọn playlist');
      return;
    }

    setIsLoading(true);
    
    try {
      const token = user?.token;
      const response = await fetch(`http://localhost:5000/api/user-playlists/${selectedPlaylistId}/songs/${song._id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Lỗi khi thêm bài hát vào playlist');
      }

      showSuccess('Đã thêm bài hát vào playlist');
      // Reload playlists to update song count
      await loadPlaylists();
      onSuccess && onSuccess();
      onClose();
      
    } catch (error) {
      console.error('Add to playlist error:', error);
      showError(error.message || 'Lỗi khi thêm bài hát vào playlist');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedPlaylistId('');
    onClose();
  };

  if (!isOpen) return null;

  return (
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
      zIndex: 10000,
      padding: '1rem'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        borderRadius: '16px',
        padding: '2rem',
        width: '100%',
        maxWidth: '500px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <h2 style={{
            color: 'white',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            margin: 0
          }}>
            Thêm vào playlist
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#b3b3b3',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              e.target.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'none';
              e.target.style.color = '#b3b3b3';
            }}
          >
            <FaTimes size="1.2rem" />
          </button>
        </div>

        {/* Song Info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '2rem',
          padding: '1rem',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '8px',
            background: song?.cover 
              ? `url(http://localhost:5000${song.cover}) center/cover, linear-gradient(135deg, #1db954 0%, #1ed760 100%)`
              : 'linear-gradient(135deg, #1db954 0%, #1ed760 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            backgroundSize: 'cover, cover',
            backgroundPosition: 'center, center',
            backgroundRepeat: 'no-repeat, no-repeat'
          }}
          onError={(e) => {
            console.log('Image failed to load:', song?.cover);
            e.target.style.background = 'linear-gradient(135deg, #1db954 0%, #1ed760 100%)';
          }}
          >
            {!song?.cover && (
              <FaMusic size="1.2rem" color="white" style={{ opacity: 0.8 }} />
            )}
          </div>
          <div>
            <h3 style={{
              color: 'white',
              fontSize: '1rem',
              fontWeight: 'bold',
              margin: 0,
              marginBottom: '0.25rem'
            }}>
              {song?.title}
            </h3>
            <p style={{
              color: '#b3b3b3',
              fontSize: '0.9rem',
              margin: 0
            }}>
              {song?.artist}
            </p>
          </div>
        </div>

        {/* Playlist Selection */}
        <div style={{ marginBottom: '2rem' }}>
          <label style={{
            display: 'block',
            color: 'white',
            fontSize: '1rem',
            fontWeight: '600',
            marginBottom: '1rem'
          }}>
            Chọn playlist
          </label>
          
          {playlists.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: '#b3b3b3'
            }}>
              <FaMusic size="2rem" style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p>Chưa có playlist nào</p>
              <p style={{ fontSize: '0.9rem' }}>Tạo playlist mới để thêm bài hát</p>
            </div>
          ) : (
            <div style={{
              maxHeight: '200px',
              overflowY: 'auto',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px'
            }}>
              {playlists.map(playlist => (
                <div
                  key={playlist._id}
                  onClick={() => setSelectedPlaylistId(playlist._id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    background: selectedPlaylistId === playlist._id ? 'rgba(29, 185, 84, 0.1)' : 'transparent',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedPlaylistId !== playlist._id) {
                      e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedPlaylistId !== playlist._id) {
                      e.target.style.background = 'transparent';
                    }
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: `url(${playlist.cover ? `http://localhost:5000${playlist.cover}` : '/default-cover.png'}) center/cover`
                  }} />
                  <div style={{ flex: 1 }}>
                    <h4 style={{
                      color: 'white',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      margin: 0,
                      marginBottom: '0.25rem'
                    }}>
                      {playlist.name}
                    </h4>
                    <p style={{
                      color: '#b3b3b3',
                      fontSize: '0.8rem',
                      margin: 0
                    }}>
                      {playlist.songs?.length || 0} bài hát
                    </p>
                  </div>
                  {selectedPlaylistId === playlist._id && (
                    <div style={{
                      color: '#1db954',
                      fontSize: '1.2rem'
                    }}>
                      ✓
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'flex-end'
        }}>
          <button
            type="button"
            onClick={handleClose}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            Hủy
          </button>
          <button
            onClick={handleAddToPlaylist}
            disabled={isLoading || !selectedPlaylistId}
            style={{
              padding: '0.75rem 1.5rem',
              background: isLoading || !selectedPlaylistId ? '#666' : '#1db954',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isLoading || !selectedPlaylistId ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              if (!isLoading && selectedPlaylistId) {
                e.target.style.background = '#1ed760';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading && selectedPlaylistId) {
                e.target.style.background = '#1db954';
              }
            }}
          >
            {isLoading ? 'Đang thêm...' : 'Thêm vào playlist'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddToPlaylistModal;
