import React, { useState, useRef, useEffect } from 'react';
import {
  FaPlay,
  FaPause,
  FaStepBackward,
  FaStepForward,
  FaRandom,
  FaRedo,
  FaChevronUp,
  FaHeart,
  FaRegHeart,
  FaList,
  FaMusic
} from 'react-icons/fa';
import { usePlayer } from './PlayerContext';
import { useAuth } from './AuthContext';
import { useFavorites } from './FavoritesContext';

const withMediaBase = (p) => (p && p.startsWith('/uploads') ? `http://localhost:5000${p}` : p);

const MobilePlayer = () => {
  const {
    current,
    isPlaying,
    shuffle,
    repeat,
    progress,
    duration,
    queue,
    currentIdx,
    setIsPlaying,
    setShuffle,
    setRepeat,
    setCurrentIdx,
    setProgress
  } = usePlayer();

  const { isAuthenticated } = useAuth();
  const { isFavorited, toggleFavorite } = useFavorites();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const audioRef = useRef(null);

  // Format time
  const formatTime = (seconds) => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle next/previous
  const handleNext = () => {
    if (!queue || queue.length === 0) return;
    const nextIdx = (currentIdx + 1) % queue.length;
    setCurrentIdx(nextIdx);
  };

  const handlePrevious = () => {
    if (!queue || queue.length === 0) return;
    if (progress > 3) {
      setProgress(0);
      if (audioRef.current) audioRef.current.currentTime = 0;
    } else {
      const prevIdx = currentIdx === 0 ? queue.length - 1 : currentIdx - 1;
      setCurrentIdx(prevIdx);
    }
  };

  // Handle seek
  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    setProgress(newTime);
    if (audioRef.current) audioRef.current.currentTime = newTime;
  };

  if (!current) return null;

  const isSongFavorite = isAuthenticated && isFavorited('song', current._id);

  return (
    <>
      {/* Mini Player (Bottom Bar) */}
      {!isExpanded && (
        <div
          onClick={() => setIsExpanded(true)}
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: '70px',
            background: 'linear-gradient(135deg, #1e1e24 0%, #2a2a35 100%)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 1rem',
            gap: '1rem',
            zIndex: 9996,
            cursor: 'pointer',
            boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.3)'
          }}
        >
          {/* Album Art */}
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '8px',
              overflow: 'hidden',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
            }}
          >
            <img
              src={withMediaBase(current.cover) || '/default-cover.png'}
              alt={current.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                animation: isPlaying ? 'pulse 2s ease-in-out infinite' : 'none'
              }}
            />
          </div>

          {/* Song Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                color: '#fff',
                fontSize: '0.9rem',
                fontWeight: '600',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {current.title}
            </div>
            <div
              style={{
                color: '#b3b3b3',
                fontSize: '0.8rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {current.artist}
            </div>
          </div>

          {/* Play/Pause Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsPlaying(!isPlaying);
            }}
            style={{
              width: '45px',
              height: '45px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1db954, #1ed760)',
              border: 'none',
              color: '#fff',
              fontSize: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(29, 185, 84, 0.4)',
              transition: 'all 0.2s ease'
            }}
          >
            {isPlaying ? <FaPause /> : <FaPlay style={{ marginLeft: '2px' }} />}
          </button>

          {/* Progress Bar */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'rgba(255, 255, 255, 0.1)'
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${duration > 0 ? (progress / duration) * 100 : 0}%`,
                background: 'linear-gradient(90deg, #1db954, #1ed760)',
                transition: 'width 0.1s linear'
              }}
            />
          </div>
        </div>
      )}

      {/* Expanded Player (Full Screen) */}
      {isExpanded && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, #1e1e24 0%, #2a2a35 100%)',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideUp 0.3s ease-out',
            overflowY: 'auto'
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <button
              onClick={() => setIsExpanded(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '1.5rem',
                cursor: 'pointer',
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: 'rotate(180deg)'
              }}
            >
              <FaChevronUp />
            </button>

            <span style={{ color: '#b3b3b3', fontSize: '0.9rem' }}>
              Đang phát
            </span>

            <button
              onClick={() => setShowQueue(!showQueue)}
              style={{
                background: showQueue ? 'rgba(29, 185, 84, 0.2)' : 'transparent',
                border: 'none',
                color: showQueue ? '#1db954' : '#fff',
                fontSize: '1.25rem',
                cursor: 'pointer',
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px'
              }}
            >
              <FaList />
            </button>
          </div>

          {/* Content */}
          {!showQueue ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '2rem 1.5rem',
                gap: '2rem'
              }}
            >
              {/* Spinning Disc */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: '1rem',
                  filter: 'drop-shadow(0 8px 24px rgba(0, 0, 0, 0.5))'
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    width: '280px',
                    height: '280px'
                  }}
                >
                  {/* Vinyl Disc */}
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      background: `
                        radial-gradient(circle at center,
                          #0a0a0a 0%,
                          #0a0a0a 8%,
                          #1a1a1a 8%,
                          #1a1a1a 10%,
                          #0a0a0a 10%,
                          #0a0a0a 15%,
                          #1a1a1a 15%,
                          #1a1a1a 17%,
                          #0a0a0a 17%,
                          #0a0a0a 22%,
                          #1a1a1a 22%,
                          #1a1a1a 24%,
                          #0a0a0a 24%,
                          #0a0a0a 100%
                        )
                      `,
                      boxShadow: `
                        0 12px 40px rgba(0, 0, 0, 0.8),
                        0 4px 16px rgba(0, 0, 0, 0.6),
                        inset 0 0 30px rgba(0, 0, 0, 0.7),
                        inset 0 0 60px rgba(0, 0, 0, 0.4)
                      `,
                      animation: isPlaying ? 'spin 3s linear infinite' : 'none',
                      position: 'relative',
                      overflow: 'hidden',
                      border: '2px solid #000'
                    }}
                  >
                    {/* Light Reflection Effect */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        borderRadius: '50%',
                        background: `
                          linear-gradient(135deg,
                            transparent 0%,
                            rgba(255, 255, 255, 0.03) 25%,
                            transparent 50%,
                            rgba(255, 255, 255, 0.02) 75%,
                            transparent 100%
                          )
                        `,
                        pointerEvents: 'none'
                      }}
                    />

                    {/* Album Cover in Center */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '50%',
                        height: '50%',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        boxShadow: `
                          0 0 0 4px rgba(255, 255, 255, 0.05),
                          0 0 0 8px rgba(255, 255, 255, 0.03),
                          0 4px 16px rgba(0, 0, 0, 0.6)
                        `,
                        border: '3px solid rgba(255, 255, 255, 0.08)'
                      }}
                    >
                      <img
                        src={withMediaBase(current.cover) || '/default-cover.png'}
                        alt={current.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          filter: 'brightness(0.95) contrast(1.05)'
                        }}
                      />
                    </div>

                    {/* Center Dot */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #1db954, #1ed760)',
                        boxShadow: `
                          0 0 0 2px rgba(0, 0, 0, 0.8),
                          0 0 0 4px rgba(29, 185, 84, 0.3),
                          0 2px 12px rgba(29, 185, 84, 0.6),
                          inset 0 1px 2px rgba(255, 255, 255, 0.3)
                        `,
                        zIndex: 10
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Song Info */}
              <div style={{ textAlign: 'center' }}>
                <h2
                  style={{
                    color: '#fff',
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    margin: '0 0 0.5rem 0'
                  }}
                >
                  {current.title}
                </h2>
                <p
                  style={{
                    color: '#b3b3b3',
                    fontSize: '1rem',
                    margin: 0
                  }}
                >
                  {current.artist}
                </p>
              </div>

              {/* Progress Bar */}
              <div>
                <div
                  onClick={handleSeek}
                  style={{
                    height: '4px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    position: 'relative',
                    marginBottom: '0.5rem'
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${duration > 0 ? (progress / duration) * 100 : 0}%`,
                      background: 'linear-gradient(90deg, #1db954, #1ed760)',
                      borderRadius: '2px',
                      position: 'relative'
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        right: '-6px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: '#fff',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                      }}
                    />
                  </div>
                </div>

                {/* Time */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: '#b3b3b3',
                    fontSize: '0.8rem'
                  }}
                >
                  <span>{formatTime(progress)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '1.5rem'
                }}
              >
                {/* Shuffle */}
                <button
                  onClick={() => setShuffle(!shuffle)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: shuffle ? '#1db954' : '#b3b3b3',
                    fontSize: '1.25rem',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <FaRandom />
                </button>

                {/* Previous */}
                <button
                  onClick={handlePrevious}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '1.75rem',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <FaStepBackward />
                </button>

                {/* Play/Pause */}
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1db954, #1ed760)',
                    border: 'none',
                    color: '#fff',
                    fontSize: '1.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(29, 185, 84, 0.4)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isPlaying ? <FaPause /> : <FaPlay style={{ marginLeft: '3px' }} />}
                </button>

                {/* Next */}
                <button
                  onClick={handleNext}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '1.75rem',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <FaStepForward />
                </button>

                {/* Repeat */}
                <button
                  onClick={() => setRepeat(!repeat)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: repeat ? '#1db954' : '#b3b3b3',
                    fontSize: '1.25rem',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <FaRedo />
                </button>
              </div>

              {/* Favorite Button */}
              {isAuthenticated && (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button
                    onClick={() => toggleFavorite('song', current._id)}
                    style={{
                      background: isSongFavorite ? 'rgba(29, 185, 84, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                      border: isSongFavorite ? '1px solid #1db954' : '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '25px',
                      padding: '0.75rem 1.5rem',
                      color: isSongFavorite ? '#1db954' : '#fff',
                      fontSize: '1rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {isSongFavorite ? <FaHeart /> : <FaRegHeart />}
                    {isSongFavorite ? 'Đã thích' : 'Thích'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Queue View */
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
              <h3 style={{ color: '#fff', marginBottom: '1rem' }}>
                Hàng đợi ({queue.length} bài)
              </h3>
              {queue.map((song, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setCurrentIdx(idx);
                    setShowQueue(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.75rem',
                    background: idx === currentIdx ? 'rgba(29, 185, 84, 0.1)' : 'transparent',
                    borderRadius: '8px',
                    marginBottom: '0.5rem',
                    cursor: 'pointer',
                    border: idx === currentIdx ? '1px solid rgba(29, 185, 84, 0.3)' : '1px solid transparent'
                  }}
                >
                  <img
                    src={withMediaBase(song.cover) || '/default-cover.png'}
                    alt={song.title}
                    style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '6px',
                      objectFit: 'cover'
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        color: idx === currentIdx ? '#1db954' : '#fff',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {song.title}
                    </div>
                    <div
                      style={{
                        color: '#b3b3b3',
                        fontSize: '0.8rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {song.artist}
                    </div>
                  </div>
                  {idx === currentIdx && (
                    <FaMusic style={{ color: '#1db954', fontSize: '1rem' }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>
        {`
          @keyframes slideUp {
            from {
              transform: translateY(100%);
            }
            to {
              transform: translateY(0);
            }
          }

          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }

          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.02);
            }
          }
        `}
      </style>
    </>
  );
};

export default MobilePlayer;

