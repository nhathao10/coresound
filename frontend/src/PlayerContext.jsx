import React, { createContext, useContext, useMemo, useState, useEffect } from "react";

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  // Initialize state from localStorage if available
  const initializeFromStorage = () => {
    try {
      const savedState = localStorage.getItem('cs_player_state');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        return {
          queue: parsed.queue || [],
          currentIdx: parsed.currentIdx !== null ? parsed.currentIdx : null,
          isPlaying: false, // Always start paused on page load
          shuffle: parsed.shuffle || false,
          repeat: parsed.repeat || false,
          progress: parsed.progress || 0,
          duration: parsed.duration || 0,
          volume: parsed.volume !== undefined ? parsed.volume : 1,
          queueContext: parsed.queueContext || "suggestions",
          pendingPlay: null,
          shouldRestorePosition: true // Flag to restore position on initial load
        };
      }
    } catch (error) {
      console.error('Error loading player state from localStorage:', error);
    }
    return null;
  };

  const initialState = initializeFromStorage();
  const [queue, setQueue] = useState(initialState?.queue || []);
  const [currentIdx, setCurrentIdx] = useState(initialState?.currentIdx !== null ? initialState.currentIdx : null);
  const [isPlaying, setIsPlaying] = useState(false); // Always start paused
  const [shuffle, setShuffle] = useState(initialState?.shuffle || false);
  const [repeat, setRepeat] = useState(initialState?.repeat || false);
  const [progress, setProgress] = useState(initialState?.progress || 0);
  const [duration, setDuration] = useState(initialState?.duration || 0);
  const [volume, setVolume] = useState(initialState?.volume !== undefined ? initialState.volume : 1);
  const [queueContext, setQueueContext] = useState(initialState?.queueContext || "suggestions");
  const [pendingPlay, setPendingPlay] = useState(null);
  const [shouldRestorePosition, setShouldRestorePosition] = useState(initialState?.shouldRestorePosition || false);

  const current = currentIdx !== null && queue[currentIdx] ? queue[currentIdx] : null;

  // Save state to localStorage whenever it changes (except isPlaying which is temporary)
  useEffect(() => {
    try {
      const stateToSave = {
        queue,
        currentIdx,
        shuffle,
        repeat,
        volume,
        queueContext,
        progress, // Save progress periodically for position restoration
        // Don't save isPlaying, duration as they're temporary
        timestamp: Date.now()
      };
      localStorage.setItem('cs_player_state', JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Error saving player state to localStorage:', error);
    }
  }, [queue, currentIdx, shuffle, repeat, volume, queueContext, progress]);


  // Handle pending play when queue is ready
  useEffect(() => {
    if (pendingPlay && queue.length > 0) {
      const { songs, startIndex } = pendingPlay;
      if (startIndex >= 0 && startIndex < queue.length) {
        setCurrentIdx(startIndex);
        setIsPlaying(true);
        setPendingPlay(null);
      }
    }
  }, [queue, pendingPlay]);

  const playAt = (idx) => {
    if (!queue.length) return;
    const nextIdx = Math.max(0, Math.min(idx, queue.length - 1));
    setCurrentIdx(nextIdx);
    setIsPlaying(true);
    setProgress(0); // Reset progress when manually selecting song
    setShouldRestorePosition(false); // Don't restore position for manual selection
  };

  const setQueueAndPlay = (songs, startIndex = 0) => {
    const newQueue = Array.isArray(songs) ? songs : [];
    
    if (newQueue.length > 0 && startIndex >= 0 && startIndex < newQueue.length) {
      setQueue(newQueue);
      setPendingPlay({ songs: newQueue, startIndex });
      setProgress(0); // Reset progress when starting new playback
      setShouldRestorePosition(false); // Don't restore position for new queue
    } else {
      setQueue([]);
      setCurrentIdx(null);
      setIsPlaying(false);
      setPendingPlay(null);
      setProgress(0);
      setShouldRestorePosition(false);
    }
  };

  const stopPlayer = () => {
    setQueue([]);
    setCurrentIdx(null);
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);
    setPendingPlay(null);
  };

  const value = useMemo(
    () => ({
      // state
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
      shouldRestorePosition,
      // setters/controls (GlobalPlayer wires audio side-effects)
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
    }),
    [queue, currentIdx, isPlaying, shuffle, repeat, progress, duration, volume, queueContext, shouldRestorePosition]
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}


