import { useState, useEffect } from 'react';
import { useFavorites } from './FavoritesContext';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { FaPlay, FaPause, FaMusic, FaCompactDisc, FaTimes } from 'react-icons/fa';
import { usePlayer } from './PlayerContext';

const Favorites = () => {
  const { user, isAuthenticated } = useAuth();
  const { favorites, isLoading, getFavoriteSongs, getFavoriteAlbums, removeFromFavorites } = useFavorites();
  const { showError } = useToast();
  const { setQueueAndPlay, current, isPlaying, setIsPlaying } = usePlayer();
  const [activeTab, setActiveTab] = useState('songs');

  const withMediaBase = (p) => (p && p.startsWith("/uploads") ? `http://localhost:5000${p}` : p);

  const favoriteSongs = getFavoriteSongs();
  const favoriteAlbums = getFavoriteAlbums();

  const handlePlaySong = (song) => {
    try {
      const realIdx = favoriteSongs.findIndex(s => s._id === song._id);
      
      if (realIdx !== -1) {
        const isCurrent = current && current._id === song._id;
        
        if (isCurrent) {
          setIsPlaying(!isPlaying);
        } else {
          setQueueAndPlay(favoriteSongs, realIdx);
        }
      }
    } catch (error) {
      console.error('handlePlaySong error:', error);
      showError('Không thể phát nhạc');
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        color: '#fff',
        fontSize: '1.2rem'
      }}>
        Vui lòng đăng nhập để xem danh sách yêu thích
      </div>
    );
  }

  return (
    <div className="music-app dark-theme">
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem',
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        marginTop: '2rem',
        marginBottom: '120px' // Space for music bar
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '2rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <button
            onClick={() => window.location.hash = '#/'}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '0.5rem',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.15)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            ←
          </button>
          <h1 style={{
            color: '#fff',
            fontSize: '2rem',
            fontWeight: '700',
            margin: 0,
            background: 'linear-gradient(135deg, #1db954, #1ed760)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Danh sách yêu thích
          </h1>
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex',
          gap: '2rem',
          marginBottom: '2rem',
          padding: '1rem',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#1db954'
          }}>
            <FaMusic />
            <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>
              {favoriteSongs.length} bài hát
            </span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#1db954'
          }}>
            <FaCompactDisc />
            <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>
              {favoriteAlbums.length} album
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <button
            onClick={() => setActiveTab('songs')}
            style={{
              padding: '0.75rem 1.5rem',
              background: activeTab === 'songs' ? '#1db954' : 'transparent',
              border: 'none',
              borderRadius: '8px 8px 0 0',
              color: activeTab === 'songs' ? '#fff' : '#b3b3b3',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'songs') {
                e.target.style.color = '#fff';
                e.target.style.background = 'rgba(29, 185, 84, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'songs') {
                e.target.style.color = '#b3b3b3';
                e.target.style.background = 'transparent';
              }
            }}
          >
            Bài hát ({favoriteSongs.length})
          </button>
          <button
            onClick={() => setActiveTab('albums')}
            style={{
              padding: '0.75rem 1.5rem',
              background: activeTab === 'albums' ? '#1db954' : 'transparent',
              border: 'none',
              borderRadius: '8px 8px 0 0',
              color: activeTab === 'albums' ? '#fff' : '#b3b3b3',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'albums') {
                e.target.style.color = '#fff';
                e.target.style.background = 'rgba(29, 185, 84, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'albums') {
                e.target.style.color = '#b3b3b3';
                e.target.style.background = 'transparent';
              }
            }}
          >
            Album ({favoriteAlbums.length})
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '200px',
            color: '#b3b3b3'
          }}>
            Đang tải danh sách yêu thích...
          </div>
        ) : (
          <>
            {/* Songs Tab */}
            {activeTab === 'songs' && (
              <div>
                {favoriteSongs.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '3rem',
                    color: '#b3b3b3'
                  }}>
                    <FaMusic size="3rem" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <h3>Chưa có bài hát yêu thích</h3>
                    <p>Hãy thêm bài hát vào danh sách yêu thích để xem ở đây</p>
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '1.5rem'
                  }}>
                    {favoriteSongs.map((song) => (
                      <div
                        key={song._id}
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: '12px',
                          padding: '1rem',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          // Show remove button
                          const removeBtn = e.currentTarget.querySelector('button');
                          if (removeBtn) {
                            removeBtn.style.opacity = '1';
                            removeBtn.style.transform = 'scale(1)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                          e.currentTarget.style.transform = 'translateY(0)';
                          // Hide remove button
                          const removeBtn = e.currentTarget.querySelector('button');
                          if (removeBtn) {
                            removeBtn.style.opacity = '0';
                            removeBtn.style.transform = 'scale(0.8)';
                          }
                        }}
                        onClick={() => handlePlaySong(song)}
                      >
                        <div style={{ position: 'relative', marginBottom: '1rem' }}>
                          <img
                            src={withMediaBase(song.cover) || "/default-cover.png"}
                            alt={song.title}
                            style={{
                              width: '100%',
                              aspectRatio: '1',
                              borderRadius: '8px',
                              objectFit: 'cover'
                            }}
                          />
                          {/* Remove from favorites button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromFavorites('song', song._id);
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
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.opacity = '1';
                              e.currentTarget.style.color = '#fff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(0.8)';
                              e.currentTarget.style.opacity = '0';
                              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
                            }}
                            title="Xóa khỏi yêu thích"
                          >
                            <FaTimes size="1rem" />
                          </button>
                          <div style={{
                            position: 'absolute',
                            bottom: '8px',
                            right: '8px',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'rgba(0, 0, 0, 0.7)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(29, 185, 84, 0.9)';
                            e.currentTarget.style.transform = 'scale(1.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                          >
                            {current && current._id === song._id && isPlaying ? (
                              <FaPause size="0.8rem" />
                            ) : (
                              <FaPlay size="0.8rem" />
                            )}
                          </div>
                        </div>
                        <div>
                          <h4 style={{
                            color: '#fff',
                            fontSize: '1rem',
                            fontWeight: '600',
                            margin: '0 0 0.25rem 0',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {song.title}
                          </h4>
                          <p style={{
                            color: '#b3b3b3',
                            fontSize: '0.9rem',
                            margin: 0,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {song.artist}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Albums Tab */}
            {activeTab === 'albums' && (
              <div>
                {favoriteAlbums.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '3rem',
                    color: '#b3b3b3'
                  }}>
                    <FaCompactDisc size="3rem" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <h3>Chưa có album yêu thích</h3>
                    <p>Hãy thêm album vào danh sách yêu thích để xem ở đây</p>
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '1.5rem'
                  }}>
                    {favoriteAlbums.map((album) => (
                      <a
                        key={album._id}
                        href={`#/album/${encodeURIComponent(album._id)}`}
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: '12px',
                          padding: '1rem',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer',
                          textDecoration: 'none',
                          color: 'inherit',
                          display: 'block'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          // Show remove button
                          const removeBtn = e.currentTarget.querySelector('button');
                          if (removeBtn) {
                            removeBtn.style.opacity = '1';
                            removeBtn.style.transform = 'scale(1)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                          e.currentTarget.style.transform = 'translateY(0)';
                          // Hide remove button
                          const removeBtn = e.currentTarget.querySelector('button');
                          if (removeBtn) {
                            removeBtn.style.opacity = '0';
                            removeBtn.style.transform = 'scale(0.8)';
                          }
                        }}
                      >
                        <div style={{ position: 'relative', marginBottom: '1rem' }}>
                          <img
                            src={withMediaBase(album.cover) || "/default-cover.png"}
                            alt={album.title}
                            style={{
                              width: '100%',
                              aspectRatio: '1',
                              borderRadius: '8px',
                              objectFit: 'cover'
                            }}
                          />
                          {/* Remove from favorites button */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              removeFromFavorites('album', album._id);
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
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.opacity = '1';
                              e.currentTarget.style.color = '#fff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(0.8)';
                              e.currentTarget.style.opacity = '0';
                              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
                            }}
                            title="Xóa khỏi yêu thích"
                          >
                            <FaTimes size="1rem" />
                          </button>
                        </div>
                        <div>
                          <h4 style={{
                            color: '#fff',
                            fontSize: '1rem',
                            fontWeight: '600',
                            margin: '0 0 0.25rem 0',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {album.name}
                          </h4>
                          <p style={{
                            color: '#b3b3b3',
                            fontSize: '0.9rem',
                            margin: 0,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {album.artist}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Favorites;
