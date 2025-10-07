import React, { createContext, useContext, useMemo, useState } from "react";

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

  const current = currentIdx !== null ? queue[currentIdx] : null;

  const playAt = (idx) => {
    if (!queue.length) return;
    const nextIdx = Math.max(0, Math.min(idx, queue.length - 1));
    setCurrentIdx(nextIdx);
    setIsPlaying(true);
  };

  const setQueueAndPlay = (songs, startIndex = 0) => {
    setQueue(Array.isArray(songs) ? songs : []);
    setCurrentIdx(null);
    // ensure React applies queue first
    setTimeout(() => playAt(startIndex), 0);
  };

  const stopPlayer = () => {
    setQueue([]);
    setCurrentIdx(null);
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);
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
    [queue, currentIdx, isPlaying, shuffle, repeat, progress, duration, volume, current, queueContext]
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}


