import React, { useEffect, useRef, useState, useMemo } from "react";
import { FaPause, FaPlay, FaRandom, FaRedo, FaStepBackward, FaStepForward, FaVolumeUp, FaVolumeMute, FaList, FaGripVertical, FaPlus, FaMusic } from "react-icons/fa";
import { usePlayer } from "./PlayerContext.jsx";
import { useAuth } from "./AuthContext.jsx";
import HeartIcon from "./HeartIcon.jsx";
import AddToPlaylistIcon from "./AddToPlaylistIcon.jsx";
import LyricsPanel from "./LyricsPanel.jsx";

const withMediaBase = (p) => (p && p.startsWith("/uploads") ? `${import.meta.env.VITE_API_URL}${p}` : p);

export default function GlobalPlayer() {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const {
    queue,
    currentIdx,
    isPlaying,
    shuffle,
    repeat,
    progress,
    duration,
    volume,
    current,
    queueContext,
    setQueueAndPlay,
    setQueue,
    setCurrentIdx,
    setIsPlaying,
    setShuffle,
    setRepeat,
    setProgress,
    setDuration,
    setVolume,
    setQueueContext,
    playAt,
    stopPlayer,
    shouldRestorePosition,
  } = usePlayer();

  const audioRef = useRef(null);
  const [showNextSongPanel, setShowNextSongPanel] = useState(false);
  const [currentQueue, setCurrentQueue] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [wasAuthenticated, setWasAuthenticated] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const scrollContainerRef = useRef(null);
  const [showLyrics, setShowLyrics] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(1);
  const [listenStartTime, setListenStartTime] = useState(null);
  const [currentSongId, setCurrentSongId] = useState(null);
  const [hasSavedCurrentSong, setHasSavedCurrentSong] = useState(false);

  // Add song to listening history with duration
  const addToListeningHistory = async (songId, listenDuration, isCompleted) => {
    if (!isAuthenticated || !user?.token || !songId) return;
    
    const durationInSeconds = Math.floor(listenDuration || 0);
    
    // Only save if listened for at least 30 seconds
    if (durationInSeconds < 30) {
      console.log('⏭️ Skipped (< 30s):', durationInSeconds);
      return;
    }
    
    console.log('📊 Saving to history:', {
      songId,
      duration: durationInSeconds,
      completed: isCompleted,
      listenDuration
    });
    
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          songId: songId,
          duration: durationInSeconds,
          completed: isCompleted || false
        })
      });
      console.log('✅ History saved successfully');
    } catch (error) {
      console.error('❌ Error adding to listening history:', error);
    }
  };

  // Check if we're on an admin page
  const isOnAdminPage = () => {
    const hash = window.location.hash || '#/';
    return hash.startsWith('#/upload') || 
           hash.startsWith('#/albums-admin') || 
           hash.startsWith('#/artists-admin') || 
           hash.startsWith('#/genres-admin') || 
           hash.startsWith('#/regions-admin') || 
           hash.startsWith('#/users-admin') ||
           hash.startsWith('#/lyrics-admin');
  };

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // Stop music when entering admin pages
  useEffect(() => {
    const handleHashChange = () => {
      if (isOnAdminPage() && isPlaying) {
        setIsPlaying(false);
        if (audioRef.current) {
          audioRef.current.pause();
        }
      }
    };

    // Check immediately
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [isPlaying, setIsPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const onTime = () => setProgress(audio.currentTime);
    const onMeta = () => setDuration(audio.duration || 0);
    
    // Track when song ends
    const onEnded = () => {
      if (currentSongId && listenStartTime && !hasSavedCurrentSong) {
        const listenDuration = (Date.now() - listenStartTime) / 1000;
        addToListeningHistory(currentSongId, listenDuration, true);
        setHasSavedCurrentSong(true);
      }
    };
    
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnded);
    
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnded);
    };
  }, [currentIdx, currentSongId, listenStartTime]);

  // Re-setup audio event listeners when returning from admin page
  useEffect(() => {
    const handleHashChange = () => {
      if (!isOnAdminPage() && current && audioRef.current) {
        // Re-setup event listeners after returning from admin
        const audio = audioRef.current;
        const onTime = () => setProgress(audio.currentTime);
        const onMeta = () => setDuration(audio.duration || 0);
        
        // Remove existing listeners first
        audio.removeEventListener("timeupdate", onTime);
        audio.removeEventListener("loadedmetadata", onMeta);
        
        // Add listeners again
        audio.addEventListener("timeupdate", onTime);
        audio.addEventListener("loadedmetadata", onMeta);
        
        // Force update progress if audio is ready
        if (audio.readyState >= 2) {
          setProgress(audio.currentTime);
          setDuration(audio.duration || 0);
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [current]);

  // Handle song change - save previous song's listening time
  useEffect(() => {
    // Save previous song's listening time before changing
    if (currentSongId && listenStartTime && current?._id !== currentSongId && !hasSavedCurrentSong) {
      const listenDuration = (Date.now() - listenStartTime) / 1000;
      const audio = audioRef.current;
      const isCompleted = audio && audio.duration > 0 && audio.currentTime >= audio.duration * 0.8;
      console.log('🔄 Song changed, saving previous song duration:', listenDuration);
      addToListeningHistory(currentSongId, listenDuration, isCompleted);
    }
    
    // Track new song
    if (current?._id && current._id !== currentSongId) {
      console.log('🎵 New song started:', current.title);
      setCurrentSongId(current._id);
      setListenStartTime(Date.now());
      setHasSavedCurrentSong(false);
    }
  }, [current?._id]);

  // Restore playback position when audio is loaded (after page refresh)
  useEffect(() => {
    if (!current || !audioRef.current || !shouldRestorePosition) return;
    
    const audio = audioRef.current;
    
    const restorePosition = () => {
      try {
        const savedState = localStorage.getItem('cs_player_state');
        if (savedState) {
          const parsed = JSON.parse(savedState);
          // Only restore position if it's the same song and position is reasonable
          if (parsed.progress > 0 && parsed.progress < (audio.duration || 0) * 0.95) {
            // Check if saved state is recent (within 30 minutes) and matches current song
            const isRecent = (Date.now() - (parsed.timestamp || 0)) < 30 * 60 * 1000;
            if (isRecent) {
              console.log('🔄 Restoring playback position:', parsed.progress);
              audio.currentTime = parsed.progress;
              setProgress(parsed.progress);
            }
          }
        }
      } catch (error) {
        console.error('Error restoring playback position:', error);
      }
    };
    
    // Restore position when audio metadata is loaded
    const onLoadedMetadata = () => {
      restorePosition();
    };
    
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    
    // If audio is already loaded, restore immediately
    if (audio.readyState >= 1) {
      restorePosition();
    }
    
    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
    };
  }, [current?._id, shouldRestorePosition]); // Only run when song changes or flag changes

  useEffect(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.play().catch(error => {
        console.error('Audio play error:', error);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentIdx, current, isAuthenticated]);

  // Ensure progress updates continuously when component is visible
  useEffect(() => {
    if (!current || isOnAdminPage()) return;
    
    const interval = setInterval(() => {
      if (audioRef.current && audioRef.current.readyState >= 2) {
        setProgress(audioRef.current.currentTime);
      }
    }, 100); // Update every 100ms
    
    return () => clearInterval(interval);
  }, [current, isOnAdminPage]);

  // Track authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      setWasAuthenticated(true);
    }
  }, [isAuthenticated]);

  // Stop music when user logs out (but allow guest users to play music)
  useEffect(() => {
    // Only stop music if user was previously authenticated and now is not (logout scenario)
    // Guest users (never authenticated) should be able to play music
    if (!isAuthenticated && queue.length > 0 && wasAuthenticated) {
      // Save listening time before logout
      if (currentSongId && listenStartTime) {
        const listenDuration = (Date.now() - listenStartTime) / 1000;
        const audio = audioRef.current;
        const isCompleted = audio && audio.duration > 0 && audio.currentTime >= audio.duration * 0.8;
        addToListeningHistory(currentSongId, listenDuration, isCompleted);
      }
      // This is a logout, stop music
      stopPlayer();
      setWasAuthenticated(false);
    }
  }, [isAuthenticated, queue.length, stopPlayer, wasAuthenticated, currentSongId, listenStartTime]);

  const next = () => {
    if (queue.length === 0) return;
    
    if (shuffle) {
      let n = Math.floor(Math.random() * queue.length);
      while (queue.length > 1 && n === currentIdx) n = Math.floor(Math.random() * queue.length);
      setCurrentIdx(n);
    } else {
      // Use allSongs order for next/prev navigation
      if (allSongs.length > 0) {
        const currentSongInPanel = allSongs.find(song => song.isCurrent);
        if (currentSongInPanel) {
          const currentPanelIndex = allSongs.findIndex(song => song.isCurrent);
          const nextPanelIndex = (currentPanelIndex + 1) % allSongs.length;
          const nextSong = allSongs[nextPanelIndex];
          setCurrentIdx(nextSong.queueIndex);
        } else {
          // Fallback to original logic
          if (queueContext === "genre-filter") {
            // For genre-filter, loop back to start when reaching end
            setCurrentIdx((i) => (i === null || i === queue.length - 1 ? 0 : i + 1));
          } else {
            setCurrentIdx((i) => (i === null || i === queue.length - 1 ? 0 : i + 1));
          }
        }
      } else {
        // Fallback to original logic
      setCurrentIdx((i) => (i === null || i === queue.length - 1 ? 0 : i + 1));
      }
    }
    setIsPlaying(true);
  };
  const prev = () => {
    if (queue.length === 0) return;
    
    if (shuffle) {
      let n = Math.floor(Math.random() * queue.length);
      while (queue.length > 1 && n === currentIdx) n = Math.floor(Math.random() * queue.length);
      setCurrentIdx(n);
    } else {
      // Use allSongs order for next/prev navigation
      if (allSongs.length > 0) {
        const currentSongInPanel = allSongs.find(song => song.isCurrent);
        if (currentSongInPanel) {
          const currentPanelIndex = allSongs.findIndex(song => song.isCurrent);
          const prevPanelIndex = currentPanelIndex === 0 ? allSongs.length - 1 : currentPanelIndex - 1;
          const prevSong = allSongs[prevPanelIndex];
          setCurrentIdx(prevSong.queueIndex);
        } else {
          // Fallback to original logic
          setCurrentIdx((i) => (i === 0 || i === null ? queue.length - 1 : i - 1));
        }
      } else {
        // Fallback to original logic
      setCurrentIdx((i) => (i === 0 || i === null ? queue.length - 1 : i - 1));
      }
    }
    setIsPlaying(true);
  };
  const onEnded = () => {
    if (repeat && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else {
      next();
    }
  };

  const formatTime = (sec) => {
    if (isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleMuteToggle = () => {
    if (isMuted) {
      // Unmute: restore previous volume
      setVolume(previousVolume);
      setIsMuted(false);
    } else {
      // Mute: save current volume and set to 0
      setPreviousVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  };

  // Get all songs in queue with current song at top - memoized to prevent random reshuffling
  const allSongs = useMemo(() => {
    if (!queue || queue.length === 0 || currentIdx === null) return [];
    
    const allSongs = [];
    
    // Add current song first
    allSongs.push({ ...queue[currentIdx], queueIndex: currentIdx, isCurrent: true });
    
    // Add remaining songs after current
    for (let i = currentIdx + 1; i < queue.length; i++) {
      allSongs.push({ ...queue[i], queueIndex: i, isCurrent: false });
    }
    
    // Add songs before current (for circular queue)
    for (let i = 0; i < currentIdx; i++) {
      allSongs.push({ ...queue[i], queueIndex: i, isCurrent: false });
    }
    
    // If context is "suggestions" or "genre-filter", limit to 20 songs total (including current)
    if ((queueContext === "suggestions" || queueContext === "genre-filter") && allSongs.length > 20) {
      // Keep current song and take next 19 songs in order (no shuffle)
      const currentSong = allSongs[0]; // Current song is always first
      const nextSongs = allSongs.slice(1, 20); // Take next 19 songs in order
      
      return [currentSong, ...nextSongs];
    }
    return allSongs;
  }, [queue, currentIdx, queueContext]);

  // Drag and drop handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
    
    // Auto-scroll when dragging near edges
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const rect = container.getBoundingClientRect();
      const scrollThreshold = 50;
      
      if (e.clientY - rect.top < scrollThreshold) {
        // Scroll up
        container.scrollTop -= 10;
      } else if (rect.bottom - e.clientY < scrollThreshold) {
        // Scroll down
        container.scrollTop += 10;
      }
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Reorder the queue
    const newQueue = [...queue];
    const draggedSong = newQueue[draggedIndex];
    
    // Remove dragged song
    newQueue.splice(draggedIndex, 1);
    
    // Insert at new position
    const newIndex = dropIndex > draggedIndex ? dropIndex - 1 : dropIndex;
    newQueue.splice(newIndex, 0, draggedSong);
    
    // Calculate new current index after reordering
    let newCurrentIdx = currentIdx;
    
    // If we're moving the currently playing song
    if (draggedIndex === currentIdx) {
      newCurrentIdx = newIndex;
    } else if (draggedIndex < currentIdx && newIndex >= currentIdx) {
      // Moving a song from before current to after current
      newCurrentIdx = currentIdx - 1;
    } else if (draggedIndex > currentIdx && newIndex <= currentIdx) {
      // Moving a song from after current to before current
      newCurrentIdx = currentIdx + 1;
    }
    
    // Update queue without restarting playback
    // We need to update the queue and current index without calling playAt
    setQueue(newQueue);
    setCurrentIdx(newCurrentIdx);
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Don't show player on admin pages
  if (isOnAdminPage()) return null;

  if (!current) return null;

  return (
    <div className="music-bar spotify-bar">
      <div className="spotify-bar-left">
        <img className="spotify-album-art" src={withMediaBase(current.cover) || "/default-cover.png"} alt="Album Art" />
        <div className="spotify-song-info" style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="spotify-song-title">{current.title}</span>
            {isAuthenticated && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {current?.type !== 'podcast' && (
                  <HeartIcon 
                    type="song"
                    itemId={current._id}
                    style={{
                      width: '24px',
                      height: '24px',
                      minWidth: '24px',
                      minHeight: '24px',
                      borderRadius: '50%',
                      background: 'rgba(0, 0, 0, 0.6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backdropFilter: 'blur(4px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      boxSizing: 'border-box',
                      flexShrink: 0,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      position: 'static',
                      top: 'auto',
                      right: 'auto',
                      zIndex: 'auto',
                      opacity: 1
                    }}
                  />
                )}
                {current?.type !== 'podcast' && (
                  <AddToPlaylistIcon 
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('openAddToPlaylist', { 
                        detail: { song: current } 
                      }));
                    }}
                    style={{
                      position: 'static !important',
                      top: 'auto !important',
                      right: 'auto !important',
                      width: '24px',
                      height: '24px',
                      minWidth: '24px',
                      minHeight: '24px',
                      borderRadius: '50%',
                      background: 'rgba(0, 0, 0, 0.6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backdropFilter: 'blur(4px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      boxSizing: 'border-box',
                      flexShrink: 0,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      zIndex: 'auto',
                      opacity: '1 !important'
                    }}
                  />
                )}
              </div>
            )}
          </div>
          <span className="spotify-song-artist">{current.artist}</span>
        </div>
      </div>
      <div className="spotify-bar-center">
        <div className="spotify-controls">
          <button className={`spotify-btn shuffle${shuffle ? " active" : ""}`} onClick={() => setShuffle((s) => !s)} title="Shuffle">
            <FaRandom />
          </button>
          <button className="spotify-btn prev" onClick={prev}>
            <FaStepBackward />
          </button>
          <button className="spotify-btn playpause" onClick={() => setIsPlaying((p) => !p)}>
            {isPlaying ? <FaPause /> : <FaPlay />}
          </button>
          <button className="spotify-btn next" onClick={next}>
            <FaStepForward />
          </button>
          <button className={`spotify-btn repeat${repeat ? " active" : ""}`} onClick={() => setRepeat((r) => !r)} title="Repeat">
            <FaRedo />
          </button>
          <button 
            className="spotify-btn next-song" 
            onClick={() => setShowNextSongPanel(!showNextSongPanel)} 
            title="Danh sách bài hát tiếp theo"
          >
            <FaList />
          </button>
        </div>
        <div className="spotify-progress-row">
          <span className="spotify-time-label">{formatTime(progress)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={progress}
            onChange={(e) => {
              const v = Number(e.target.value);
              setProgress(v);
              if (audioRef.current) audioRef.current.currentTime = v;
            }}
            className="spotify-progress-slider"
            title="Tiến trình"
          />
          <span className="spotify-time-label">{formatTime(duration)}</span>
        </div>
      </div>
      <div className="spotify-bar-right">
        {current?.type !== 'podcast' && (
          <button 
            className={`spotify-btn lyrics${showLyrics ? " active" : ""}`} 
            onClick={() => setShowLyrics(!showLyrics)} 
            title="Hiển thị lyrics"
          >
            <FaMusic />
          </button>
        )}
        <button 
          className="spotify-btn volume-mute" 
          onClick={handleMuteToggle}
          title={isMuted ? "Bật tiếng" : "Tắt tiếng"}
        >
          {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
        </button>
        <span className="spotify-volume-percentage">
          {Math.round(volume * 100)}%
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => {
            const newVolume = Number(e.target.value);
            setVolume(newVolume);
            setIsMuted(newVolume === 0);
          }}
          className="spotify-volume-slider"
          title="Âm lượng"
        />
      </div>
      <audio 
        ref={audioRef} 
        src={withMediaBase(current.url)} 
        autoPlay={isPlaying} 
        onEnded={onEnded}
      />
      
      {/* Next Songs Panel */}
      {showNextSongPanel && (
        <div style={{
          position: "absolute",
          bottom: "100%",
          right: "90px",
          width: "350px",
          maxHeight: "400px",
          background: "#1e1e24",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "8px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          zIndex: 1000,
          overflow: "hidden",
          marginBottom: "10px"
        }}>
          <div style={{
            padding: "1rem",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            background: "#2a2a35"
          }}>
            <h3 style={{ 
              color: "#fff", 
              margin: 0, 
              fontSize: "1rem",
              fontWeight: "600"
            }}>
              Bài hát tiếp theo
            </h3>
            <p style={{ 
              color: "#b3b3b3", 
              margin: "0.25rem 0 0 0", 
              fontSize: "0.8rem" 
            }}>
              {allSongs.length} bài hát trong danh sách • Kéo thả để sắp xếp
            </p>
          </div>
          
          <div ref={scrollContainerRef} style={{ maxHeight: "300px", overflowY: "auto" }}>
            {allSongs.length > 0 ? allSongs.map((song, index) => (
              <div
                key={`${song._id}-${song.queueIndex}`}
                draggable
                onDragStart={(e) => handleDragStart(e, song.queueIndex)}
                onDragOver={(e) => handleDragOver(e, song.queueIndex)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, song.queueIndex)}
                onDragEnd={handleDragEnd}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem 1rem",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                  cursor: "grab",
                  transition: "all 0.2s ease",
                  background: dragOverIndex === song.queueIndex ? "rgba(29, 185, 84, 0.1)" : 
                             draggedIndex === song.queueIndex ? "rgba(255, 255, 255, 0.1)" : 
                             song.isCurrent ? "rgba(29, 185, 84, 0.05)" : "transparent",
                  opacity: draggedIndex === song.queueIndex ? 0.5 : 1,
                  transform: draggedIndex === song.queueIndex ? "scale(0.98)" : "scale(1)",
                  borderLeft: song.isCurrent ? "3px solid #1db954" : 
                             dragOverIndex === song.queueIndex ? "3px solid rgba(29, 185, 84, 0.5)" : "3px solid transparent"
                }}
                onMouseEnter={(e) => {
                  if (draggedIndex !== song.queueIndex && !song.isCurrent) {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                  }
                  // Highlight drag handle on hover
                  const dragHandle = e.currentTarget.querySelector('.drag-handle');
                  if (dragHandle) {
                    dragHandle.style.color = "#1db954";
                  }
                }}
                onMouseLeave={(e) => {
                  if (draggedIndex !== song.queueIndex && dragOverIndex !== song.queueIndex && !song.isCurrent) {
                    e.currentTarget.style.background = "transparent";
                  } else if (song.isCurrent) {
                    e.currentTarget.style.background = "rgba(29, 185, 84, 0.05)";
                  }
                  // Reset drag handle color
                  const dragHandle = e.currentTarget.querySelector('.drag-handle');
                  if (dragHandle) {
                    dragHandle.style.color = "#888";
                  }
                }}
                onClick={() => {
                  setCurrentIdx(song.queueIndex);
                  setIsPlaying(true);
                }}
              >
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "0.5rem",
                  minWidth: "40px"
                }}>
                  <FaGripVertical 
                    className="drag-handle"
                    style={{ 
                      color: "#888", 
                      fontSize: "0.9rem",
                      cursor: "grab",
                      transition: "color 0.2s ease"
                    }} 
                  />
                  <span style={{ 
                    color: song.isCurrent ? "#1db954" : "#b3b3b3", 
                    fontSize: "0.8rem",
                    fontWeight: song.isCurrent ? "600" : "normal"
                  }}>
                    {index + 1}
                  </span>
                  {song.isCurrent && (
                    <FaPlay style={{ color: "#1db954", fontSize: "0.6rem", marginLeft: "0.25rem" }} />
                  )}
                </div>
                <img 
                  src={withMediaBase(song.cover) || "/default-cover.png"} 
                  alt={song.title}
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "4px",
                    objectFit: "cover"
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    color: "#fff", 
                    fontSize: "0.9rem",
                    fontWeight: "500",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}>
                    {song.title}
                  </div>
                  <div style={{ 
                    color: "#b3b3b3", 
                    fontSize: "0.8rem",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}>
                    {song.artist}
                  </div>
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
                    justifyContent: "center",
                    transition: "color 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#1db954";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#b3b3b3";
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIdx(song.queueIndex);
                    setIsPlaying(true);
                  }}
                >
                  <FaPlay style={{ fontSize: "0.7rem" }} />
                </button>
              </div>
            )) : (
              <div style={{
                padding: "2rem 1rem",
                textAlign: "center",
                color: "#b3b3b3"
              }}>
                Không có bài hát trong danh sách
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Lyrics Panel - Only show for songs, not podcasts */}
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
    </div>
  );
}


