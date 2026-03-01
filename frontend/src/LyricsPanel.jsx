import { useState, useEffect, useRef } from 'react';
import { FaTimes, FaPlay, FaPause, FaVolumeUp } from 'react-icons/fa';

const LyricsPanel = ({ isOpen, onClose, currentSong, currentTime, isPlaying, onSeek }) => {
  const [lyrics, setLyrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeLineIndex, setActiveLineIndex] = useState(-1);
  const lyricsContainerRef = useRef(null);
  const activeLineRef = useRef(null);

  // Fetch lyrics when song changes
  useEffect(() => {
    if (isOpen && currentSong?._id) {
      fetchLyrics(currentSong._id);
    }
  }, [isOpen, currentSong?._id]);

  // Update active line based on current time
  useEffect(() => {
    if (lyrics?.hasTimestamps && lyrics.timestamps?.length > 0) {
      const currentLineIndex = findCurrentLineIndex(currentTime);
      setActiveLineIndex(currentLineIndex);
      
      // Auto-scroll to active line
      if (activeLineRef.current && currentLineIndex >= 0) {
        activeLineRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }, [currentTime, lyrics]);

  const fetchLyrics = async (songId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/songs/${songId}/lyrics`);
      if (response.ok) {
        const data = await response.json();
        setLyrics(data.lyrics);
      } else {
        setError('Không tìm thấy lyrics cho bài hát này');
      }
    } catch (err) {
      setError('Lỗi khi tải lyrics');
      console.error('Error fetching lyrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const findCurrentLineIndex = (time) => {
    if (!lyrics?.timestamps || lyrics.timestamps.length === 0) return -1;
    
    for (let i = lyrics.timestamps.length - 1; i >= 0; i--) {
      if (lyrics.timestamps[i].time <= time) {
        return i;
      }
    }
    return -1;
  };

  const handleLineClick = (timestamp) => {
    if (onSeek && timestamp.time !== undefined) {
      onSeek(timestamp.time);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="lyrics-panel">
      <div className="lyrics-header">
        <div className="lyrics-song-info">
          <div className="song-image">
            <img 
              src={currentSong?.cover ? `${import.meta.env.VITE_API_URL}${currentSong.cover}` : '/default-album.svg'} 
              alt={currentSong?.title}
              onError={(e) => {
                e.target.src = '/default-album.svg';
              }}
            />
          </div>
          <div className="song-details">
            <h3>{currentSong?.title}</h3>
            <p>{currentSong?.artist}</p>
          </div>
        </div>
        <button className="lyrics-close-btn" onClick={onClose}>
          <FaTimes />
        </button>
      </div>

      <div className="lyrics-content" ref={lyricsContainerRef}>
        {loading && (
          <div className="lyrics-loading">
            <div className="loading-spinner"></div>
            <p>Đang tải lyrics...</p>
          </div>
        )}

        {error && (
          <div className="lyrics-error">
            <p>{error}</p>
            <button onClick={() => fetchLyrics(currentSong._id)}>
              Thử lại
            </button>
          </div>
        )}

        {lyrics && !loading && !error && (
          <>
            {lyrics.hasTimestamps && lyrics.timestamps?.length > 0 ? (
              // Timestamped lyrics
              <div className="lyrics-timestamped">
                {lyrics.timestamps.map((timestamp, index) => (
                  <div
                    key={index}
                    ref={index === activeLineIndex ? activeLineRef : null}
                    className={`lyrics-line ${index === activeLineIndex ? 'active' : ''} ${
                      index < activeLineIndex ? 'passed' : ''
                    }`}
                    onClick={() => handleLineClick(timestamp)}
                  >
                    <span className="lyrics-time">
                      {formatTime(timestamp.time)}
                    </span>
                    <span className="lyrics-text">{timestamp.text}</span>
                  </div>
                ))}
              </div>
            ) : lyrics.text ? (
              // Plain text lyrics
              <div className="lyrics-plain">
                {lyrics.text.split('\n').map((line, index) => (
                  <div key={index} className="lyrics-line">
                    {line}
                  </div>
                ))}
              </div>
            ) : (
              <div className="lyrics-empty">
                <FaVolumeUp />
                <p>Chưa có lyrics cho bài hát này</p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="lyrics-footer">
        <div className="lyrics-info">
          {lyrics && (
            <>
              <span className="lyrics-language">
                {lyrics.language === 'vi' ? 'Tiếng Việt' : 
                 lyrics.language === 'en' ? 'English' : 
                 lyrics.language?.toUpperCase()}
              </span>
              {lyrics.isOfficial && (
                <span className="lyrics-official">Chính thức</span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LyricsPanel;

