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
  FaMusic,
  FaVolumeUp,
  FaVolumeMute
} from 'react-icons/fa';
import { usePlayer } from './PlayerContext';
import { useAuth } from './AuthContext';
import { useFavorites } from './FavoritesContext';
import LyricsPanel from './LyricsPanel';

const withMediaBase = (p) => (p && p.startsWith('/uploads') ? `http://localhost:5000${p}` : p);

const MobilePlayer = () => {
  const {
    current,
    isPlaying,
    shuffle,
    repeat,
    progress,
    duration,
    volume,
    queue,
    currentIdx,
    queueContext,
    setIsPlaying,
    setShuffle,
    setRepeat,
    setCurrentIdx,
    setProgress,
    setDuration,
    setVolume,
    setQueueContext
  } = usePlayer();

  const { isAuthenticated } = useAuth();
  const { isFavorited, toggleFavorite } = useFavorites();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(1);
  const audioRef = useRef(null);
  const [listenStartTime, setListenStartTime] = useState(null);
  const [currentSongId, setCurrentSongId] = useState(null);
  const [hasSavedCurrentSong, setHasSavedCurrentSong] = useState(false);

  // Add song to listening history with duration
  const addToListeningHistory = async (songId, listenDuration, isCompleted) => {
    if (!isAuthenticated || !songId) return;
    
    const durationInSeconds = Math.floor(listenDuration || 0);
    
    // Only save if listened for at least 30 seconds
    if (durationInSeconds < 30) {
      return;
    }
    
    try {
      const savedUser = localStorage.getItem('cs_user');
      if (!savedUser) return;
      
      const userData = JSON.parse(savedUser);
      const token = userData.token;
      
      if (!token) return;

      await fetch('http://localhost:5000/api/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          songId: songId,
          duration: durationInSeconds,
          completed: isCompleted || false
        })
      });
    } catch (error) {
      console.error('Error adding to listening history:', error);
    }
  };

  // Set volume on audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Update audio src when current song changes - CRITICAL FOR PLAYBACK
  useEffect(() => {
    if (!audioRef.current || !current) return;
    
    const audio = audioRef.current;
    const newSrc = withMediaBase(current.url);
    
    // Get current src (remove origin if it's a full URL)
    const currentSrc = audio.src || '';
    const currentSrcPath = currentSrc.includes(window.location.origin) 
      ? currentSrc.replace(window.location.origin, '') 
      : currentSrc;
    const newSrcPath = newSrc.includes(window.location.origin)
      ? newSrc.replace(window.location.origin, '')
      : newSrc;
    
    // Only update if src has changed (compare paths)
    if (!currentSrc || currentSrcPath !== newSrcPath) {
      console.log('🎵 MobilePlayer: Updating audio src from', currentSrcPath, 'to', newSrcPath);
      
      // Pause current playback
      audio.pause();
      
      // Reset progress
      setProgress(0);
      setDuration(0);
      
      // Update src - use full URL
      const fullUrl = newSrc.startsWith('http') ? newSrc : `${window.location.origin}${newSrc}`;
      audio.src = fullUrl;
      
      // Load the new audio
      audio.load();
      
      console.log('🎵 MobilePlayer: Audio src updated, readyState:', audio.readyState);
    }
  }, [current?._id, current?.url]);

  // Setup audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const onTime = () => {
      if (audio.readyState >= 2) {
        setProgress(audio.currentTime);
      }
    };
    
    const onMeta = () => {
      setDuration(audio.duration || 0);
    };
    
    const onLoadedData = () => {
      console.log('🎵 MobilePlayer: Audio loaded, readyState:', audio.readyState);
      // If we should be playing and audio is ready, play it
      if (isPlaying && audio.readyState >= 2) {
        audio.play().catch(error => {
          console.error('Audio play error after loaded:', error);
        });
      }
    };
    
    const onEnded = () => {
      // Save listening history when song ends
      if (currentSongId && listenStartTime && !hasSavedCurrentSong) {
        const listenDuration = (Date.now() - listenStartTime) / 1000;
        addToListeningHistory(currentSongId, listenDuration, true);
        setHasSavedCurrentSong(true);
      }
      
      // Handle repeat or next
      if (repeat) {
        audio.currentTime = 0;
        audio.play().catch(err => console.error('Play error:', err));
      } else {
        handleNext();
      }
    };
    
    const onError = (e) => {
      console.error('Audio error:', e, audio.error);
      setIsPlaying(false);
    };
    
    const onCanPlay = () => {
      console.log('🎵 MobilePlayer: Audio can play');
      if (isPlaying) {
        audio.play().catch(error => {
          console.error('Audio play error on canplay:', error);
        });
      }
    };
    
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("loadeddata", onLoadedData);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    audio.addEventListener("canplay", onCanPlay);
    
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("loadeddata", onLoadedData);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("canplay", onCanPlay);
    };
  }, [currentIdx, currentSongId, listenStartTime, repeat, isPlaying]);

  // Track song changes for listening history
  useEffect(() => {
    // Save previous song's listening time before changing
    if (currentSongId && listenStartTime && current?._id !== currentSongId && !hasSavedCurrentSong) {
      const listenDuration = (Date.now() - listenStartTime) / 1000;
      const audio = audioRef.current;
      const isCompleted = audio && audio.duration > 0 && audio.currentTime >= audio.duration * 0.8;
      addToListeningHistory(currentSongId, listenDuration, isCompleted);
    }
    
    // Track new song
    if (current?._id && current._id !== currentSongId) {
      console.log('🎵 MobilePlayer: New song detected:', current.title);
      setCurrentSongId(current._id);
      setListenStartTime(Date.now());
      setHasSavedCurrentSong(false);
      // Reset progress for new song
      setProgress(0);
    }
  }, [current?._id]);

  // Play/pause audio when isPlaying changes
  useEffect(() => {
    if (!audioRef.current || !current) return;
    
    const audio = audioRef.current;
    
    // Only play if audio is ready
    if (isPlaying) {
      if (audio.readyState >= 2) {
        audio.play().catch(error => {
          console.error('Audio play error:', error);
          setIsPlaying(false);
        });
      } else {
        // Wait for audio to be ready
        const playWhenReady = () => {
          audio.play().catch(error => {
            console.error('Audio play error when ready:', error);
            setIsPlaying(false);
          });
          audio.removeEventListener('canplay', playWhenReady);
        };
        audio.addEventListener('canplay', playWhenReady);
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, current]);

  // Update progress continuously
  useEffect(() => {
    if (!current) return;
    
    const interval = setInterval(() => {
      if (audioRef.current && audioRef.current.readyState >= 2) {
        setProgress(audioRef.current.currentTime);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [current]);

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
    
    if (shuffle) {
      let nextIdx = Math.floor(Math.random() * queue.length);
      while (queue.length > 1 && nextIdx === currentIdx) {
        nextIdx = Math.floor(Math.random() * queue.length);
      }
      setCurrentIdx(nextIdx);
    } else {
      const nextIdx = currentIdx === null || currentIdx === queue.length - 1 ? 0 : currentIdx + 1;
      setCurrentIdx(nextIdx);
    }
    setIsPlaying(true);
  };

  const handlePrevious = () => {
    if (!queue || queue.length === 0) return;
    
    // If progress > 3 seconds, restart current song
    if (progress > 3 && audioRef.current) {
      setProgress(0);
      audioRef.current.currentTime = 0;
    } else {
      // Go to previous song
      if (shuffle) {
        let prevIdx = Math.floor(Math.random() * queue.length);
        while (queue.length > 1 && prevIdx === currentIdx) {
          prevIdx = Math.floor(Math.random() * queue.length);
        }
        setCurrentIdx(prevIdx);
      } else {
        const prevIdx = currentIdx === 0 || currentIdx === null ? queue.length - 1 : currentIdx - 1;
        setCurrentIdx(prevIdx);
      }
      setIsPlaying(true);
    }
  };

  // Handle seek
  const handleSeek = (e) => {
    if (!audioRef.current || !duration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percentage * duration;
    
    setProgress(newTime);
    audioRef.current.currentTime = newTime;
  };

  // Handle volume change
  const handleVolumeChange = (e) => {
    const newVolume = Number(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (newVolume > 0) {
      setPreviousVolume(newVolume);
    }
  };

  // Handle mute toggle
  const handleMuteToggle = () => {
    if (isMuted) {
      setVolume(previousVolume || 0.5);
      setIsMuted(false);
    } else {
      setPreviousVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  };

  if (!current) return null;

  const isSongFavorite = isAuthenticated && isFavorited('song', current._id);

  return (
    <>
      {/* Mini Player (Bottom Bar) - Improved Design */}
      {!isExpanded && (
        <div
          onClick={() => setIsExpanded(true)}
          className="mobile-mini-player"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: '80px',
            background: 'linear-gradient(180deg, rgba(30, 30, 36, 0.95) 0%, rgba(26, 26, 35, 0.98) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 1rem',
            gap: '1rem',
            zIndex: 9996,
            cursor: 'pointer',
            boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.5), 0 -2px 8px rgba(0, 0, 0, 0.3)'
          }}
        >
          {/* Album Art with Glow Effect */}
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              overflow: 'hidden',
              flexShrink: 0,
              boxShadow: isPlaying 
                ? '0 4px 16px rgba(29, 185, 84, 0.4), 0 0 20px rgba(29, 185, 84, 0.2)' 
                : '0 4px 12px rgba(0, 0, 0, 0.4)',
              transition: 'all 0.3s ease',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={withMediaBase(current.cover) || '/default-cover.png'}
              alt={current.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                animation: isPlaying ? 'pulse 2s ease-in-out infinite' : 'none',
                filter: isPlaying ? 'brightness(1.1)' : 'brightness(1)',
                transition: 'filter 0.3s ease'
              }}
            />
            {isPlaying && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'radial-gradient(circle, transparent 40%, rgba(29, 185, 84, 0.1) 100%)',
                  pointerEvents: 'none'
                }}
              />
            )}
          </div>

          {/* Song Info with Better Typography */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.25rem' }} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                color: '#fff',
                fontSize: '0.95rem',
                fontWeight: '600',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: '1.3',
                letterSpacing: '-0.01em'
              }}
              title={current.title}
            >
              {current.title}
            </div>
            <div
              style={{
                color: '#a0a0a0',
                fontSize: '0.8rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: '1.3',
                fontWeight: '400'
              }}
              title={current.artist}
            >
              {current.artist}
            </div>
          </div>

          {/* Play/Pause Button - Enhanced */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsPlaying(!isPlaying);
            }}
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: isPlaying 
                ? 'linear-gradient(135deg, #1db954 0%, #1ed760 100%)' 
                : 'linear-gradient(135deg, #1db954 0%, #1ed760 100%)',
              border: 'none',
              color: '#fff',
              fontSize: '1.3rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              boxShadow: isPlaying 
                ? '0 6px 20px rgba(29, 185, 84, 0.5), 0 0 30px rgba(29, 185, 84, 0.3)' 
                : '0 4px 16px rgba(29, 185, 84, 0.4)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: isPlaying ? 'scale(1)' : 'scale(1)',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {/* Ripple effect background */}
            {isPlaying && (
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '100%',
                  height: '100%',
                  background: 'radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%)',
                  transform: 'translate(-50%, -50%)',
                  animation: 'ripple 2s ease-out infinite',
                  pointerEvents: 'none'
                }}
              />
            )}
            {isPlaying ? <FaPause style={{ position: 'relative', zIndex: 1 }} /> : <FaPlay style={{ marginLeft: '3px', position: 'relative', zIndex: 1 }} />}
          </button>

          {/* Progress Bar - Enhanced */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'rgba(255, 255, 255, 0.05)'
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${duration > 0 ? (progress / duration) * 100 : 0}%`,
                background: 'linear-gradient(90deg, #1db954 0%, #1ed760 50%, #1db954 100%)',
                backgroundSize: '200% 100%',
                transition: 'width 0.1s linear',
                boxShadow: '0 0 8px rgba(29, 185, 84, 0.6)',
                animation: duration > 0 ? 'progressGlow 2s ease-in-out infinite' : 'none'
              }}
            />
          </div>
        </div>
      )}

      {/* Expanded Player (Full Screen) - Enhanced Design */}
      {isExpanded && (
        <div
          className="mobile-expanded-player"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(180deg, rgba(20, 20, 28, 0.98) 0%, rgba(26, 26, 35, 0.95) 50%, rgba(30, 30, 36, 0.98) 100%)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideUp 0.3s ease-out',
            overflowY: 'auto',
            boxShadow: '0 -8px 40px rgba(0, 0, 0, 0.6)'
          }}
        >
          {/* Header - Enhanced */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.25rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(255, 255, 255, 0.02)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)'
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
                transform: 'rotate(180deg)',
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              <FaChevronUp />
            </button>

            <span style={{ color: '#b3b3b3', fontSize: '0.9rem', fontWeight: '500' }}>
              Đang phát
            </span>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {current?.type !== 'podcast' && (
                <button
                  onClick={() => setShowLyrics(!showLyrics)}
                  style={{
                    background: showLyrics ? 'rgba(29, 185, 84, 0.2)' : 'transparent',
                    border: 'none',
                    color: showLyrics ? '#1db954' : '#fff',
                    fontSize: '1.25rem',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    width: '44px',
                    height: '44px',
                    transition: 'background 0.2s ease'
                  }}
                >
                  <FaMusic />
                </button>
              )}
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
                  borderRadius: '8px',
                  width: '44px',
                  height: '44px',
                  transition: 'background 0.2s ease'
                }}
              >
                <FaList />
              </button>
            </div>
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
                  gap: '2.5rem',
                  minHeight: 0,
                  alignItems: 'center'
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
                    width: '300px',
                    height: '300px',
                    maxWidth: '85vw',
                    maxHeight: '85vw'
                  }}
                >
                  {/* Vinyl Disc - Enhanced with better shadows and glow */}
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
                      boxShadow: isPlaying 
                        ? `
                          0 20px 60px rgba(0, 0, 0, 0.9),
                          0 8px 24px rgba(0, 0, 0, 0.7),
                          0 0 40px rgba(29, 185, 84, 0.2),
                          inset 0 0 40px rgba(0, 0, 0, 0.8),
                          inset 0 0 80px rgba(0, 0, 0, 0.5)
                        `
                        : `
                          0 12px 40px rgba(0, 0, 0, 0.8),
                          0 4px 16px rgba(0, 0, 0, 0.6),
                          inset 0 0 30px rgba(0, 0, 0, 0.7),
                          inset 0 0 60px rgba(0, 0, 0, 0.4)
                        `,
                      animation: isPlaying ? 'vinylSpin 8s linear infinite' : 'none',
                      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      overflow: 'hidden',
                      border: '3px solid #000'
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

              {/* Song Info - Enhanced Typography */}
              <div style={{ textAlign: 'center', padding: '0 1.5rem', width: '100%', maxWidth: '100%' }}>
                <h2
                  style={{
                    color: '#fff',
                    fontSize: '1.75rem',
                    fontWeight: '700',
                    margin: '0 0 0.75rem 0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    lineHeight: '1.3',
                    letterSpacing: '-0.02em'
                  }}
                  title={current.title}
                >
                  {current.title}
                </h2>
                <p
                  style={{
                    color: '#a0a0a0',
                    fontSize: '1.1rem',
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontWeight: '400',
                    lineHeight: '1.4'
                  }}
                  title={current.artist}
                >
                  {current.artist}
                </p>
              </div>

              {/* Progress Bar */}
              <div style={{ padding: '0 1rem' }}>
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
                  gap: '1.5rem',
                  flexWrap: 'wrap'
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
                    transition: 'all 0.2s ease',
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
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
                    transition: 'all 0.2s ease',
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  <FaStepBackward />
                </button>

                {/* Play/Pause - Enhanced with Ripple Effect */}
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: isPlaying
                      ? 'linear-gradient(135deg, #1db954 0%, #1ed760 100%)'
                      : 'linear-gradient(135deg, #1db954 0%, #1ed760 100%)',
                    border: 'none',
                    color: '#fff',
                    fontSize: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: isPlaying
                      ? '0 12px 32px rgba(29, 185, 84, 0.6), 0 0 40px rgba(29, 185, 84, 0.4)'
                      : '0 8px 24px rgba(29, 185, 84, 0.4)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.08)';
                    e.currentTarget.style.boxShadow = '0 14px 36px rgba(29, 185, 84, 0.7), 0 0 50px rgba(29, 185, 84, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = isPlaying
                      ? '0 12px 32px rgba(29, 185, 84, 0.6), 0 0 40px rgba(29, 185, 84, 0.4)'
                      : '0 8px 24px rgba(29, 185, 84, 0.4)';
                  }}
                  onTouchStart={(e) => {
                    e.currentTarget.style.transform = 'scale(0.95)';
                  }}
                  onTouchEnd={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {/* Ripple effect when playing */}
                  {isPlaying && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: '100%',
                        height: '100%',
                        background: 'radial-gradient(circle, rgba(255, 255, 255, 0.25) 0%, transparent 70%)',
                        transform: 'translate(-50%, -50%)',
                        animation: 'ripple 2s ease-out infinite',
                        pointerEvents: 'none',
                        borderRadius: '50%'
                      }}
                    />
                  )}
                  <span style={{ position: 'relative', zIndex: 1 }}>
                    {isPlaying ? <FaPause /> : <FaPlay style={{ marginLeft: '4px' }} />}
                  </span>
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
                    transition: 'all 0.2s ease',
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
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
                    transition: 'all 0.2s ease',
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  <FaRedo />
                </button>
              </div>

              {/* Volume Control */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '0 1rem' }}>
                <button
                  onClick={handleMuteToggle}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: isMuted ? '#b3b3b3' : '#fff',
                    fontSize: '1.25rem',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  style={{
                    flex: 1,
                    maxWidth: '200px',
                    height: '4px',
                    borderRadius: '2px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    outline: 'none',
                    appearance: 'none',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ color: '#b3b3b3', fontSize: '0.8rem', minWidth: '40px', textAlign: 'right' }}>
                  {Math.round(volume * 100)}%
                </span>
              </div>

              {/* Favorite Button */}
              {isAuthenticated && current?.type !== 'podcast' && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '0 1rem' }}>
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
                      transition: 'all 0.2s ease',
                      minHeight: '44px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-1px)';
                      e.target.style.boxShadow = '0 4px 12px rgba(29, 185, 84, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
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
              <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1.2rem', fontWeight: '600' }}>
                Hàng đợi ({queue.length} bài)
              </h3>
              {queue.length > 0 ? (
                queue.map((song, idx) => (
                  <div
                    key={song._id || idx}
                    onClick={() => {
                      setCurrentIdx(idx);
                      setShowQueue(false);
                      setIsPlaying(true);
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
                      border: idx === currentIdx ? '1px solid rgba(29, 185, 84, 0.3)' : '1px solid transparent',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (idx !== currentIdx) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (idx !== currentIdx) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <img
                      src={withMediaBase(song.cover) || '/default-cover.png'}
                      alt={song.title}
                      style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '6px',
                        objectFit: 'cover',
                        flexShrink: 0
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
                          textOverflow: 'ellipsis',
                          marginBottom: '0.25rem'
                        }}
                        title={song.title}
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
                        title={song.artist}
                      >
                        {song.artist}
                      </div>
                    </div>
                    {idx === currentIdx && (
                      <FaMusic style={{ color: '#1db954', fontSize: '1rem', flexShrink: 0 }} />
                    )}
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: '#b3b3b3', padding: '2rem' }}>
                  Không có bài hát trong hàng đợi
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* Audio Element - Must be outside conditional rendering and always rendered */}
      <audio
        ref={audioRef}
        preload="auto"
        style={{ display: 'none' }}
        crossOrigin="anonymous"
      />

      {/* Lyrics Panel */}
      {current?.type !== 'podcast' && (
        <LyricsPanel
          isOpen={showLyrics}
          onClose={() => setShowLyrics(false)}
          currentSong={current}
          currentTime={progress}
          isPlaying={isPlaying}
          onSeek={(time) => {
            setProgress(time);
            if (audioRef.current) {
              audioRef.current.currentTime = time;
            }
          }}
        />
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

          @keyframes vinylSpin {
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

          @keyframes ripple {
            0% {
              transform: translate(-50%, -50%) scale(0.8);
              opacity: 1;
            }
            100% {
              transform: translate(-50%, -50%) scale(2);
              opacity: 0;
            }
          }

          @keyframes progressGlow {
            0%, 100% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
          }

          /* Volume slider styling */
          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #1db954;
            cursor: pointer;
          }

          input[type="range"]::-moz-range-thumb {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #1db954;
            cursor: pointer;
            border: none;
          }
        `}
      </style>
    </>
  );
};

export default MobilePlayer;
