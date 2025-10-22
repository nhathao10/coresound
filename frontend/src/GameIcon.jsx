import React, { useState, useRef, useEffect } from 'react';
import { FaGamepad, FaMusic, FaTrophy, FaTimes, FaPlay, FaPause, FaLightbulb, FaInfoCircle, FaTags, FaCalendarAlt, FaChartBar } from 'react-icons/fa';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const GameIcon = () => {
  const { user, isAuthenticated } = useAuth();
  const { showSuccess, showError } = useToast();
  const [showGameModal, setShowGameModal] = useState(false);
  const [dailySong, setDailySong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [lives, setLives] = useState(3);
  const [roundIndex, setRoundIndex] = useState(1); // 1..3
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [songs, setSongs] = useState([]);
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [showSongDropdown, setShowSongDropdown] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [currentClipDuration, setCurrentClipDuration] = useState(3); // Start with 3 seconds
  const [audioProgress, setAudioProgress] = useState(0);
  const [showInstructions, setShowInstructions] = useState(false);
  const audioRef = useRef(null);
  const gameModalRef = useRef(null);
  const inputRef = useRef(null);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (gameModalRef.current && !gameModalRef.current.contains(event.target)) {
        setShowGameModal(false);
        resetGame();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close song dropdown when clicking outside input
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSongDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // No timer needed - game ends when lives = 0

  const resetGame = () => {
    setDailySong(null);
    setIsPlaying(false);
    setUserAnswer('');
    setLives(3);
    setShowResult(false);
    setScore(1000);
    setGameStarted(false);
    setGameCompleted(false);
    setShowSongDropdown(false);
    setAttempts(0);
    setCurrentClipDuration(3);
    setAudioProgress(0);
    setShowInstructions(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    // Dispatch event to show GlobalPlayer
    window.dispatchEvent(new CustomEvent('gameModalClose'));
  };

  const resetTodayGame = async () => {
    try {
      // Reset today's game (silent - no toast)
      await fetch('http://localhost:5000/api/reset-today', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });

      // Generate a new random song (silent - no toast)
      await fetch('http://localhost:5000/api/new-random-song', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });

      // Reset game state and reload
      resetGame();
      
      // Reset audio element to fix playback issues
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.load();
      }
      
      fetchDailySong();
    } catch (error) {
      console.error('Error resetting today game:', error);
      // Silent error - no toast for testing button
    }
  };

  // Advance to next round: just move to next sequence
  const advanceToNextRound = async (nextRound) => {
    try {
      // local state reset for next round
      setLives(3);
      setAttempts(0);
      setCurrentClipDuration(3);
      setAudioProgress(0);
      setUserAnswer('');
      setGameCompleted(false);
      setShowResult(false);
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.load();
      }
      
      // Fetch next song with the specified round number
      const response = await fetch(`http://localhost:5000/api/daily-song?sequence=${nextRound}`);
      if (response.ok) {
        const data = await response.json();
        setDailySong(data);
        setGameStarted(true);
        setScore(1000);
      } else {
        showError('Không thể tải bài hát tiếp theo');
      }
    } catch (e) {
      console.error('Error advancing to next round:', e);
      showError('Lỗi khi chuyển sang bài tiếp theo');
    }
  };


  // Load songs for autocomplete
  useEffect(() => {
    if (showGameModal) {
      fetch('http://localhost:5000/api/songs')
        .then(res => res.json())
        .then(data => setSongs(data || []))
        .catch(err => console.error('Error loading songs:', err));
    }
  }, [showGameModal]);

  // Filter songs based on user input
  useEffect(() => {
    if (userAnswer.trim() && songs.length > 0) {
      const filtered = songs.filter(song => 
        song.title.toLowerCase().includes(userAnswer.toLowerCase()) ||
        song.artist.toLowerCase().includes(userAnswer.toLowerCase())
      ).slice(0, 8);
      setFilteredSongs(filtered);
      setShowSongDropdown(filtered.length > 0);
    } else {
      setFilteredSongs([]);
      setShowSongDropdown(false);
    }
  }, [userAnswer, songs]);

  const checkGameStatus = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/daily-song/status', {
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.hasPlayed && data.completedAllRounds && data.gameResult) {
          // User has already completed all 3 rounds today
          setGameCompleted(true);
          setShowResult(true);
          setScore(data.gameResult.score);
          setAttempts(0);
          setLives(data.gameResult.score > 0 ? 3 : 0);
          setCurrentClipDuration(3);
          setRoundIndex(3); // Set to 3 to show badge
          
          // Set the daily song with result data
          setDailySong({
            song: {
              title: data.gameResult.song.title,
              artist: data.gameResult.song.artist,
              cover: data.gameResult.song.cover
            }
          });
          
          return true; // Already played
        }
      }
      return false; // Not played yet
    } catch (error) {
      console.error('Error checking game status:', error);
      return false;
    }
  };

  const fetchDailySong = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/daily-song?sequence=${roundIndex}`);
      if (response.ok) {
        const data = await response.json();
        
        // Test if audio file exists
        if (data.audioUrl) {
          // Check if audioUrl already has full URL
          const fullUrl = data.audioUrl.startsWith('http') 
            ? data.audioUrl 
            : `http://localhost:5000${data.audioUrl}`;
          
          // Test file accessibility
          fetch(fullUrl, { method: 'HEAD' })
            .then(response => {
              if (!response.ok) {
                console.error('Audio file not accessible:', response.status);
              }
            })
            .catch(error => {
              console.error('Error testing audio file:', error);
            });
        }
        setDailySong(data);
        setGameStarted(true);
        setGameCompleted(false);
        setShowResult(false);
        setLives(3);
        setUserAnswer('');
        setScore(1000); // Start with 1000 points
        setAttempts(0);
        setCurrentClipDuration(3);
        setAudioProgress(0);
      } else {
        showError('Không thể tải bài hát hôm nay');
      }
    } catch (error) {
      console.error('Error fetching daily song:', error);
      showError('Lỗi khi tải bài hát');
    }
  };

  const playClip = () => {
    if (audioRef.current && dailySong && dailySong.audioUrl) {
      try {
        // Ensure audio src is set correctly
        const fullUrl = dailySong.audioUrl.startsWith('http') 
          ? dailySong.audioUrl 
          : `http://localhost:5000${dailySong.audioUrl}`;
        if (audioRef.current.src !== fullUrl) {
          audioRef.current.src = fullUrl;
        }
        
        audioRef.current.currentTime = dailySong.startTime;
        audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Error playing audio:', error);
        setIsPlaying(false);
        showError('Lỗi khi phát nhạc');
      }
    } else {
      showError('Không có file nhạc để phát');
    }
  };

  const skipSong = () => {
    // Skip only reduces score, doesn't reduce lives
    setScore(Math.max(0, score - 100)); // Reduce score by 100 points
    setUserAnswer('');
    
    // Extend clip duration by 5 seconds
    const newDuration = Math.min(currentClipDuration + 5, dailySong.duration);
    setCurrentClipDuration(newDuration);
  };

  // Update audio progress
  useEffect(() => {
    if (audioRef.current && isPlaying) {
      const updateProgress = () => {
        if (audioRef.current) {
          const currentTime = audioRef.current.currentTime - dailySong.startTime;
          const progress = (currentTime / currentClipDuration) * 100;
          setAudioProgress(Math.min(progress, 100));
          
          // Stop audio when clip duration is reached
          if (currentTime >= currentClipDuration) {
            audioRef.current.pause();
            setIsPlaying(false);
            setAudioProgress(0);
          }
        }
      };
      
      const interval = setInterval(updateProgress, 100);
      return () => clearInterval(interval);
    }
  }, [isPlaying, currentClipDuration, dailySong]);

  const selectSong = (song) => {
    const answerText = `${song.title} - ${song.artist}`;
    
    // Close dropdown first
    setShowSongDropdown(false);
    
    // Update input value
    setUserAnswer(answerText);
    
    // Force input focus and value update
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        // Force the input value to be set
        inputRef.current.value = answerText;
        // Trigger change event to ensure React state is in sync
        const event = new Event('input', { bubbles: true });
        inputRef.current.dispatchEvent(event);
      }
    }, 50);
  };

  const handleSubmitAnswer = async () => {
    if (!dailySong || gameCompleted || !userAnswer.trim()) {
      return;
    }

    setAttempts(attempts + 1);

    try {
      const response = await fetch('http://localhost:5000/api/daily-song/check-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          songId: dailySong.songId,
          userAnswer: userAnswer.trim(),
          timeSpent: 0, // No timer anymore
          hintsUsed: 0,
          roundNumber: roundIndex,
          currentScore: score // Send current score (after skip penalties)
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.hasPlayedToday) {
          // Already played today - show result
          setShowResult(true);
          setScore(result.score);
          setGameCompleted(true);
          if (result.isCorrect) {
            showSuccess(`Bạn đã chơi hôm nay! Điểm số: ${result.score}`);
          } else {
            showError(`Bạn đã chơi hôm nay! Đáp án đúng là: ${result.correctAnswer.title} - ${result.correctAnswer.artist}`);
          }
        } else if (result.isCorrect) {
          // Correct answer - game won
          setShowResult(true);
          setScore(result.score);
          setGameCompleted(true);
          // Update dailySong with correct answer data
          setDailySong(prev => ({
            ...prev,
            song: {
              ...prev.song,
              title: result.correctAnswer.title,
              artist: result.correctAnswer.artist,
              cover: result.correctAnswer.cover || prev.song?.cover,
              url: prev.song?.url,
              _id: prev.song?._id
            }
          }));
          // Move to next round if less than 3
          if (roundIndex < 3) {
            const nextRound = roundIndex + 1;
            setTimeout(async () => {
              setRoundIndex(nextRound);
              await advanceToNextRound(nextRound);
            }, 3000);
          } else {
            showSuccess(`Chính xác! Bạn được ${result.score} điểm!`);
          }
        } else {
          // Wrong answer - lose a life
          const newLives = lives - 1;
          setLives(newLives);
          setUserAnswer('');
          
          if (newLives === 0) {
            // Game over
            setShowResult(true);
            setScore(0);
            setGameCompleted(true);
            // Update dailySong with correct answer data for game over
            setDailySong(prev => ({
              ...prev,
              song: {
                ...prev.song,
                title: result.correctAnswer.title,
                artist: result.correctAnswer.artist,
                cover: result.correctAnswer.cover || prev.song?.cover,
                url: prev.song?.url,
                _id: prev.song?._id
              }
            }));
            // If still has next round, advance; else show message
            if (roundIndex < 3) {
              const nextRound = roundIndex + 1;
              setTimeout(async () => {
                setRoundIndex(nextRound);
                await advanceToNextRound(nextRound);
              }, 3000);
            } else {
              showError(`Game Over! Đáp án đúng là: ${result.correctAnswer.title} - ${result.correctAnswer.artist}`);
            }
          } else {
            showError(`Sai rồi! Còn ${newLives} lần thử.`);
          }
        }
      } else {
        const errorData = await response.json();
        showError(errorData.error || 'Có lỗi xảy ra khi kiểm tra đáp án.');
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      showError('Lỗi khi gửi câu trả lời');
    }
  };


  const openGameModal = async () => {
    setShowGameModal(true);
    // Dispatch event to hide GlobalPlayer
    window.dispatchEvent(new CustomEvent('gameModalOpen'));
    
    // Check if user has already played today
    const hasPlayed = await checkGameStatus();
    
    // If not played yet, fetch the daily song
    if (!hasPlayed) {
      fetchDailySong();
    }
  };

  if (!isAuthenticated) return null;

  return (
    <>
      {/* Game Icon Button */}
      <button
        onClick={openGameModal}
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          color: '#b3b3b3',
          cursor: 'pointer',
          padding: '0.75rem',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
          marginRight: '1rem'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.1)';
          e.target.style.color = '#1db954';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'none';
          e.target.style.color = '#b3b3b3';
        }}
        title="Game đoán bài hát"
      >
        <FaGamepad size="1.2rem" />
      </button>

      {/* Game Modal */}
      {showGameModal && (
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
          zIndex: 2000,
          backdropFilter: 'blur(10px)'
        }}>
          <div
            ref={gameModalRef}
            style={{
              background: 'linear-gradient(145deg, #2d2d2d 0%, #1e1e1e 50%, #1a1a1a 100%)',
              borderRadius: '20px',
              padding: '2rem',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
              animation: 'modalSlideIn 0.3s ease-out'
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <h2 style={{
                  color: 'white',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <FaGamepad size="1.2rem" color="#1db954" />
                  Daily Song Challenge
                </h2>
                <button
                  onClick={() => setShowInstructions(true)}
                  style={{
                    background: 'rgba(29, 185, 84, 0.1)',
                    border: '1px solid rgba(29, 185, 84, 0.3)',
                    color: '#1db954',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(29, 185, 84, 0.2)';
                    e.target.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(29, 185, 84, 0.1)';
                    e.target.style.transform = 'scale(1)';
                  }}
                  title="Hướng dẫn chơi game"
                >
                  i
                </button>
              </div>
              <button
                onClick={() => {
                  setShowGameModal(false);
                  resetGame();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#b3b3b3',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '50%',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 0, 0, 0.1)';
                  e.target.style.color = '#ff4444';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'none';
                  e.target.style.color = '#b3b3b3';
                }}
              >
                <FaTimes size="1rem" />
              </button>
            </div>

            {/* Game Content */}
            {!dailySong ? (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                color: '#b3b3b3'
              }}>
                <FaMusic size="3rem" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p>Đang tải bài hát hôm nay...</p>
              </div>
            ) : !showResult ? (
              <div>
                {/* Status Card - Lives / Score with Round badge */}
                <div style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  padding: '16px 20px',
                  marginBottom: 20,
                  borderRadius: 14,
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
                  border: '1px solid rgba(255,255,255,0.12)',
                  boxShadow: '0 6px 24px rgba(0,0,0,0.25)'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: -10,
                    right: -10,
                    padding: '6px 10px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: 0.3,
                    color: '#10b981',
                    background: 'linear-gradient(135deg, rgba(16,185,129,.18), rgba(16,185,129,.08))',
                    border: '1px solid rgba(16,185,129,.35)',
                    backdropFilter: 'blur(6px)'
                  }}>
                    Bài {Math.min(roundIndex, 3)}/3
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    minWidth: 140
                  }}>
                    <span style={{fontSize: 18}}>❤️</span>
                    <div style={{display: 'flex', flexDirection: 'column', lineHeight: 1.1}}>
                      <span style={{color: lives > 1 ? '#10b981' : '#ef4444', fontSize: 20, fontWeight: 800}}>
                        {lives}
                      </span>
                      <span style={{color: '#a8a8a8', fontSize: 12}}>Lives</span>
                    </div>
                  </div>

                  <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,0.08)' }} />

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    minWidth: 160
                  }}>
                    <span style={{fontSize: 18}}>🎯</span>
                    <div style={{display: 'flex', flexDirection: 'column', lineHeight: 1.1}}>
                      <span style={{color: '#10b981', fontSize: 20, fontWeight: 800}}>
                        {score}
                      </span>
                      <span style={{color: '#a8a8a8', fontSize: 12}}>Score</span>
                    </div>
                  </div>
                </div>

                {/* Audio Player with Timeline */}
                <div style={{
                  textAlign: 'center',
                  marginBottom: '1.5rem'
                }}>
                  {/* Clip Duration Display */}
                  <div style={{
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    color: '#1db954',
                    marginBottom: '1rem'
                  }}>
                    {currentClipDuration} seconds
                  </div>

                  {/* Timeline Bar */}
                  <div style={{
                    width: '100%',
                    height: '8px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '4px',
                    marginBottom: '1rem',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <div style={{
                      width: `${audioProgress}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #1db954, #1ed760)',
                      borderRadius: '4px',
                      transition: 'width 0.1s ease'
                    }} />
                  </div>

                  {/* Play Button */}
                  <button
                    onClick={playClip}
                    disabled={isPlaying}
                    style={{
                      background: 'linear-gradient(135deg, #1db954, #1ed760)',
                      border: 'none',
                      color: 'white',
                      padding: '1rem 2rem',
                      borderRadius: '50px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: isPlaying ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      margin: '0 auto'
                    }}
                    onMouseEnter={(e) => {
                      if (!isPlaying) {
                        e.target.style.transform = 'scale(1.05)';
                        e.target.style.boxShadow = '0 8px 25px rgba(29, 185, 84, 0.4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'scale(1)';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    {isPlaying ? <FaPause /> : <FaPlay />} 
                    {isPlaying ? 'Đang phát...' : 'Phát đoạn nhạc'}
                  </button>
                  {dailySong?.audioUrl && (
                    <audio
                      ref={audioRef}
                      src={dailySong.audioUrl.startsWith('http') 
                        ? dailySong.audioUrl 
                        : `http://localhost:5000${dailySong.audioUrl}`}
                      preload="metadata"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        console.error('Audio error:', e);
                        console.error('Audio src:', e.target.src);
                        setIsPlaying(false);
                        showError('Lỗi khi phát nhạc - file không hợp lệ');
                      }}
                      onLoadStart={() => {
                      }}
                      onCanPlay={() => {
                      }}
                      onEnded={() => {
                        setIsPlaying(false);
                        setAudioProgress(0);
                      }}
                    />
                  )}
                </div>

                {/* Answer Input with Autocomplete */}
                <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Nhập tên bài hát..."
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmitAnswer()}
                    onFocus={() => {
                      if (filteredSongs.length > 0) {
                        setShowSongDropdown(true);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      borderRadius: '12px',
                      border: '2px solid rgba(255, 255, 255, 0.1)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: 'white',
                      fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}
                    disabled={gameCompleted}
                  />
                  
                  {/* Autocomplete Dropdown */}
                  {showSongDropdown && filteredSongs.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'rgba(30, 30, 30, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '12px',
                      marginTop: '4px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 9999,
                      backdropFilter: 'blur(10px)'
                    }}>
                      {filteredSongs.map((song, index) => (
                        <div
                          key={song._id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            selectSong(song);
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            selectSong(song);
                          }}
                          style={{
                            padding: '0.75rem 1rem',
                            cursor: 'pointer',
                            borderBottom: index < filteredSongs.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                            transition: 'background-color 0.2s ease',
                            userSelect: 'none',
                            WebkitUserSelect: 'none',
                            MozUserSelect: 'none',
                            msUserSelect: 'none'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'rgba(29, 185, 84, 0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                          }}
                        >
                          <div style={{
                            color: 'white',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            marginBottom: '0.25rem'
                          }}>
                            {song.title}
                          </div>
                          <div style={{
                            color: '#b3b3b3',
                            fontSize: '0.8rem'
                          }}>
                            {song.artist}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}>
                  <button
                    onClick={skipSong}
                    disabled={gameCompleted}
                    style={{
                      background: 'rgba(255, 193, 7, 0.2)',
                      border: '1px solid rgba(255, 193, 7, 0.3)',
                      color: '#ffc107',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '25px',
                      fontSize: '0.9rem',
                      cursor: gameCompleted ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      flex: '1 1 30%',
                      minWidth: '120px',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => {
                      if (!gameCompleted) {
                        e.target.style.background = 'rgba(255, 193, 7, 0.3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(255, 193, 7, 0.2)';
                    }}
                  >
                     Skip
                  </button>

                  {/* Reset button removed */}
                  
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={!userAnswer.trim() || gameCompleted}
                    style={{
                      background: 'linear-gradient(135deg, #1db954, #1ed760)',
                      border: 'none',
                      color: 'white',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '25px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: !userAnswer.trim() || gameCompleted ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      flex: '1 1 30%',
                      minWidth: '120px',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => {
                      if (userAnswer.trim() && !gameCompleted) {
                        e.target.style.transform = 'scale(1.05)';
                        e.target.style.boxShadow = '0 8px 25px rgba(29, 185, 84, 0.4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'scale(1)';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    Gửi câu trả lời
                  </button>
                </div>

              </div>
            ) : (
              /* Result Display */
              <div style={{ textAlign: 'center' }}>
                {/* Completed Today Badge - Only show when completed all 3 rounds */}
                {roundIndex === 3 && (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(29, 185, 84, 0.2), rgba(29, 185, 84, 0.1))',
                    border: '2px solid rgba(29, 185, 84, 0.4)',
                    borderRadius: '12px',
                    padding: '0.75rem 1.5rem',
                    marginBottom: '1.5rem',
                    display: 'inline-block'
                  }}>
                    <p style={{
                      color: '#1db954',
                      margin: 0,
                      fontSize: '0.95rem',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <FaTrophy size="1.1rem" />
                      Bạn đã hoàn thành thử thách hôm nay!
                    </p>
                  </div>
                )}
                
                <div style={{
                  fontSize: '3rem',
                  marginBottom: '1rem'
                }}>
                  {score > 0 ? '🎉' : '😔'}
                </div>
                <h3 style={{
                  color: score > 0 ? '#1db954' : '#ff4444',
                  marginBottom: '1rem'
                }}>
                  {score > 0 ? 'Chính xác!' : 'Sai rồi!'}
                </h3>
                {/* Song Result Display */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '16px',
                  padding: '2rem',
                  marginBottom: '1.5rem',
                  border: '1px solid rgba(29, 185, 84, 0.2)'
                }}>
                  {/* Song Cover */}
                  <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #1db954, #1ed760)',
                    margin: '0 auto 1rem auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 25px rgba(29, 185, 84, 0.3)'
                  }}>
                    {(dailySong.song?.cover || dailySong.cover) ? (
                      <img 
                        src={(dailySong.song?.cover || dailySong.cover).startsWith('http') 
                          ? (dailySong.song?.cover || dailySong.cover)
                          : `http://localhost:5000${dailySong.song?.cover || dailySong.cover}`} 
                        alt="Song Cover"
                        style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: '12px',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          console.error('Cover image failed to load:', e.target.src);
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div style={{
                      display: dailySong.song?.cover || dailySong.cover ? 'none' : 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '100%'
                    }}>
                      <FaMusic size="3rem" color="white" />
                    </div>
                  </div>

                  {/* Song Info */}
                  <h3 style={{ 
                    color: '#1db954', 
                    margin: '0 0 0.5rem 0', 
                    fontSize: '1.3rem',
                    fontWeight: '600'
                  }}>
                    {dailySong.song?.title || 'Unknown Title'}
                  </h3>
                  <p style={{ 
                    color: '#b3b3b3', 
                    margin: '0 0 1rem 0', 
                    fontSize: '1rem',
                    fontWeight: '500'
                  }}>
                    {dailySong.song?.artist || 'Unknown Artist'}
                  </p>

                  {/* Score */}
                  <div style={{
                    background: 'rgba(29, 185, 84, 0.1)',
                    borderRadius: '12px',
                    padding: '1rem',
                    border: '1px solid rgba(29, 185, 84, 0.2)'
                  }}>
                    <p style={{ 
                      color: '#1db954', 
                      margin: '0 0 0.5rem 0', 
                      fontSize: '1.4rem', 
                      fontWeight: 'bold' 
                    }}>
                      🎯 {score} điểm
                    </p>
                    <p style={{ color: '#b3b3b3', margin: '0', fontSize: '0.9rem' }}>
                      Số lần thử: {attempts}  | Thời gian chơi dài nhất: {currentClipDuration}s
                    </p>
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  justifyContent: 'center'
                }}>
                  {/* Reset button removed intentionally for production */}
                  <button
                    onClick={() => {
                      setShowGameModal(false);
                      resetGame();
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #1db954, #1ed760)',
                      border: 'none',
                      color: 'white',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '25px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'scale(1.05)';
                      e.target.style.boxShadow = '0 8px 25px rgba(29, 185, 84, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'scale(1)';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    Đóng
                  </button>
                </div>
              </div>
            )}

            {/* Instructions Modal */}
            {showInstructions && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2000,
                borderRadius: '15px'
              }}>
                <div style={{
                  background: '#1a1a1a',
                  borderRadius: '20px',
                  padding: '2rem',
                  maxWidth: '400px',
                  width: '90%',
                  border: '1px solid rgba(29, 185, 84, 0.3)',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1.5rem'
                  }}>
                    <h3 style={{
                      color: '#1db954',
                      margin: 0,
                      fontSize: '1.3rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <FaInfoCircle /> Hướng dẫn chơi
                    </h3>
                    <button
                      onClick={() => setShowInstructions(false)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#b3b3b3',
                        fontSize: '1.5rem',
                        cursor: 'pointer'
                      }}
                    >
                      <FaTimes />
                    </button>
                  </div>

                  <div style={{ color: '#e0e0e0', lineHeight: '1.6' }}>
                    <div style={{ marginBottom: '1rem' }}>
                      <h4 style={{ color: '#1db954', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>
                        🎯 Mục tiêu
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.9rem' }}>
                        Nghe đoạn nhạc và đoán đúng tên bài hát + nghệ sĩ
                      </p>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <h4 style={{ color: '#1db954', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>
                        ❤️ Lives System
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.9rem' }}>
                        Bạn có <strong>3 lives</strong>. Mỗi lần đoán sai sẽ mất 1 life
                      </p>
                    </div>


                    <div style={{ marginBottom: '1rem' }}>
                      <h4 style={{ color: '#1db954', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>
                        ⏭️ Skip
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.9rem' }}>
                        Nhấn "Skip" để nghe đoạn nhạc dài hơn (+5 giây, -100 điểm)
                      </p>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <h4 style={{ color: '#1db954', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>
                        🎯 Điểm số
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.9rem' }}>
                        Bắt đầu với 1000 điểm. Đoán đúng sớm = điểm cao hơn!
                      </p>
                    </div>

                    <div style={{
                      background: 'rgba(29, 185, 84, 0.1)',
                      padding: '1rem',
                      borderRadius: '10px',
                      border: '1px solid rgba(29, 185, 84, 0.2)'
                    }}>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#1db954', fontWeight: '600' }}>
                        💡 Mẹo: Nghe kỹ đoạn nhạc trước khi đoán, sử dụng gợi ý một cách thông minh!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  );
};

export default GameIcon;