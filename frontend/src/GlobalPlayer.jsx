import React, { useEffect, useRef } from "react";
import { FaPause, FaPlay, FaRandom, FaRedo, FaStepBackward, FaStepForward, FaVolumeUp } from "react-icons/fa";
import { usePlayer } from "./PlayerContext.jsx";

const withMediaBase = (p) => (p && p.startsWith("/uploads") ? `http://localhost:5000${p}` : p);

export default function GlobalPlayer() {
  const {
    queue,
    current,
    currentIdx,
    isPlaying,
    shuffle,
    repeat,
    progress,
    duration,
    volume,
    setIsPlaying,
    setShuffle,
    setRepeat,
    setProgress,
    setDuration,
    setVolume,
    setCurrentIdx,
  } = usePlayer();

  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setProgress(audio.currentTime);
    const onMeta = () => setDuration(audio.duration || 0);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
    };
  }, [currentIdx]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.play(); else audioRef.current.pause();
  }, [isPlaying, currentIdx]);

  const next = () => {
    if (queue.length === 0) return;
    if (shuffle) {
      let n = Math.floor(Math.random() * queue.length);
      while (queue.length > 1 && n === currentIdx) n = Math.floor(Math.random() * queue.length);
      setCurrentIdx(n);
    } else {
      setCurrentIdx((i) => (i === null || i === queue.length - 1 ? 0 : i + 1));
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
      setCurrentIdx((i) => (i === 0 || i === null ? queue.length - 1 : i - 1));
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

  if (!current) return null;

  return (
    <div className="music-bar spotify-bar">
      <div className="spotify-bar-left">
        <img className="spotify-album-art" src={withMediaBase(current.cover) || "/default-cover.png"} alt="Album Art" />
        <div className="spotify-song-info">
          <span className="spotify-song-title">{current.title}</span>
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
        <span className="spotify-volume-icon">
          <FaVolumeUp />
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="spotify-volume-slider"
          title="Âm lượng"
        />
      </div>
      <audio ref={audioRef} src={withMediaBase(current.url)} autoPlay={isPlaying} onEnded={onEnded} />
    </div>
  );
}


