import React, { createContext, useContext, useMemo, useState, useEffect } from "react";

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const [queue, setQueue] = useState([]); // array of songs
  const [currentIdx, setCurrentIdx] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [queueContext, setQueueContext] = useState("suggestions"); // "suggestions" hoặc "album"
  const [pendingPlay, setPendingPlay] = useState(null); // {songs, startIndex}

  const current = currentIdx !== null && queue[currentIdx] ? queue[currentIdx] : null;

  // Debug effect to track state changes
  useEffect(() => {
    console.log("PlayerContext: State changed - currentIdx:", currentIdx, "queue.length:", queue.length, "current:", current?.name || "null");
  }, [currentIdx, queue.length, current]);

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
  };

  const setQueueAndPlay = (songs, startIndex = 0) => {
    const newQueue = Array.isArray(songs) ? songs : [];
    
    if (newQueue.length > 0 && startIndex >= 0 && startIndex < newQueue.length) {
      setQueue(newQueue);
      setPendingPlay({ songs: newQueue, startIndex });
    } else {
      setQueue([]);
      setCurrentIdx(null);
      setIsPlaying(false);
      setPendingPlay(null);
    }
  };

  const stopPlayer = () => {
    console.log("PlayerContext: stopPlayer called - clearing all state");
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
    [queue, currentIdx, isPlaying, shuffle, repeat, progress, duration, volume, queueContext]
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}


