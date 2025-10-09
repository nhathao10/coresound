import { useState, useEffect } from 'react';
import { FaMusic, FaPlus, FaSearch, FaFilter, FaBars } from 'react-icons/fa';
import LyricsEditor from './LyricsEditor.jsx';
import AdminSidebar from './AdminSidebar.jsx';

const LyricsAdmin = () => {
  const [songs, setSongs] = useState([]);
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, with-lyrics, without-lyrics
  const [selectedSong, setSelectedSong] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    fetchSongs();
  }, []);

  useEffect(() => {
    filterSongs();
  }, [songs, searchQuery, filterType]);

  const fetchSongs = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/songs');
      if (response.ok) {
        const data = await response.json();
        setSongs(data);
      } else {
        setError('Lỗi khi tải danh sách bài hát');
      }
    } catch (err) {
      setError('Lỗi kết nối');
      console.error('Error fetching songs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterSongs = () => {
    let filtered = [...songs];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(song => 
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query)
      );
    }

    // Filter by lyrics status
    if (filterType === 'with-lyrics') {
      filtered = filtered.filter(song => 
        song.lyrics && 
        (song.lyrics.text || (song.lyrics.timestamps && song.lyrics.timestamps.length > 0))
      );
    } else if (filterType === 'without-lyrics') {
      filtered = filtered.filter(song => 
        !song.lyrics || 
        (!song.lyrics.text && (!song.lyrics.timestamps || song.lyrics.timestamps.length === 0))
      );
    }

    setFilteredSongs(filtered);
  };

  const handleEditLyrics = (song) => {
    setSelectedSong(song);
    setShowEditor(true);
  };

  const handleDeleteLyrics = async (song) => {
    if (!confirm(`Bạn có chắc muốn xóa lyrics của bài "${song.title}"?`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/songs/${song._id}/lyrics`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Update local state
        setSongs(prev => prev.map(s => 
          s._id === song._id 
            ? { ...s, lyrics: { text: '', hasTimestamps: false, timestamps: [], isOfficial: false } }
            : s
        ));
        alert('Xóa lyrics thành công!');
      } else {
        const errorData = await response.json();
        alert(`Lỗi: ${errorData.error}`);
      }
    } catch (err) {
      alert('Lỗi kết nối');
      console.error('Error deleting lyrics:', err);
    }
  };

  const handleEditorSave = (updatedLyrics) => {
    // Update local state
    setSongs(prev => prev.map(s => 
      s._id === selectedSong._id 
        ? { ...s, lyrics: updatedLyrics }
        : s
    ));
    setShowEditor(false);
    setSelectedSong(null);
  };

  const handleEditorClose = () => {
    setShowEditor(false);
    setSelectedSong(null);
  };

  const hasLyrics = (song) => {
    return song.lyrics && 
           (song.lyrics.text || (song.lyrics.timestamps && song.lyrics.timestamps.length > 0));
  };

  const getLyricsPreview = (song) => {
    if (!hasLyrics(song)) return 'Chưa có lyrics';
    
    if (song.lyrics.hasTimestamps && song.lyrics.timestamps?.length > 0) {
      return `${song.lyrics.timestamps.length} dòng với timestamps`;
    } else if (song.lyrics.text) {
      const preview = song.lyrics.text.substring(0, 50);
      return preview.length < song.lyrics.text.length ? `${preview}...` : preview;
    }
    
    return 'Có lyrics';
  };

  const withMediaBase = (p) => (p && p.startsWith("/uploads") ? `http://localhost:5000${p}` : p);

  if (loading) {
    return (
      <div className="admin-container">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 1rem' }}></div>
          <p>Đang tải danh sách bài hát...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <AdminSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className={`admin-main-content ${sidebarOpen ? 'with-sidebar' : 'without-sidebar'}`}>
        <div className="admin-header">
          <div className="admin-title">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                background: "transparent",
                border: "1px solid #3a3a45",
                borderRadius: "8px",
                color: "#b3b3b3",
                padding: "0.5rem",
                cursor: "pointer",
                marginRight: "1rem",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "40px",
                height: "40px"
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "rgba(255, 255, 255, 0.1)";
                e.target.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "transparent";
                e.target.style.color = "#b3b3b3";
              }}
            >
              <FaBars />
            </button>
            <FaMusic />
            <h1>Quản lý Lyrics</h1>
          </div>
        <div className="admin-stats">
          <div className="stat-item">
            <span className="stat-number">{songs.length}</span>
            <span className="stat-label">Tổng bài hát</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{songs.filter(hasLyrics).length}</span>
            <span className="stat-label">Có lyrics</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{songs.filter(s => !hasLyrics(s)).length}</span>
            <span className="stat-label">Chưa có lyrics</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="admin-error">
          {error}
          <button onClick={fetchSongs}>Thử lại</button>
        </div>
      )}

      <div className="admin-filters">
        <div className="filter-group">
          <label>Tìm kiếm bài hát</label>
          <div className="search-box">
            <FaSearch />
            <input
              type="text"
              placeholder="Nhập tên bài hát, nghệ sĩ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="filter-group">
          <label>Bộ lọc</label>
          <div className="filter-buttons">
            <button
              className={filterType === 'all' ? 'active' : ''}
              onClick={() => setFilterType('all')}
            >
              Tất cả ({songs.length})
            </button>
            <button
              className={filterType === 'with-lyrics' ? 'active' : ''}
              onClick={() => setFilterType('with-lyrics')}
            >
              Có lyrics ({songs.filter(hasLyrics).length})
            </button>
            <button
              className={filterType === 'without-lyrics' ? 'active' : ''}
              onClick={() => setFilterType('without-lyrics')}
            >
              Chưa có lyrics ({songs.filter(s => !hasLyrics(s)).length})
            </button>
          </div>
        </div>
      </div>

      <div className="lyrics-admin-content">
        <div className="songs-table">
          <div className="table-header">
            <div className="col-cover">Ảnh bìa</div>
            <div className="col-info">Thông tin bài hát</div>
            <div className="col-lyrics">Lyrics</div>
            <div className="col-actions">Thao tác</div>
          </div>
          
          <div className="table-body">
            {filteredSongs.length === 0 ? (
              <div className="empty-state">
                <FaMusic />
                <p>Không tìm thấy bài hát nào</p>
              </div>
            ) : (
              filteredSongs.map((song) => (
                <div key={song._id} className="table-row">
                  <div className="col-cover">
                    <img
                      src={withMediaBase(song.cover) || "/default-cover.png"}
                      alt={song.title}
                      className="song-cover"
                    />
                  </div>
                  
                  <div className="col-info">
                    <div className="song-title">{song.title}</div>
                    <div className="song-artist">{song.artist}</div>
                    {song.album?.name && (
                      <div className="song-album">Album: {song.album.name}</div>
                    )}
                    <div className="song-plays">
                      {song.plays?.toLocaleString('vi-VN')} lượt nghe
                    </div>
                  </div>
                  
                  <div className="col-lyrics">
                    <div className={`lyrics-status ${hasLyrics(song) ? 'has-lyrics' : 'no-lyrics'}`}>
                      {hasLyrics(song) ? (
                        <>
                          <FaMusic className="status-icon" />
                          <span>Có lyrics</span>
                        </>
                      ) : (
                        <>
                          <FaMusic className="status-icon" />
                          <span>Chưa có lyrics</span>
                        </>
                      )}
                    </div>
                    {hasLyrics(song) && (
                      <>
                        <div className="lyrics-preview">
                          {getLyricsPreview(song)}
                        </div>
                        {song.lyrics.language && (
                          <div className="lyrics-language">
                            {song.lyrics.language === 'vi' ? 'Tiếng Việt' : 
                             song.lyrics.language === 'en' ? 'English' : 
                             song.lyrics.language?.toUpperCase()}
                            {song.lyrics.isOfficial && (
                              <span className="official-badge">Chính thức</span>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  
                  <div className="col-actions">
                    <div className="action-buttons">
                      <button
                        className="action-btn edit-btn"
                        onClick={() => handleEditLyrics(song)}
                        title="Chỉnh sửa lyrics"
                      >
                        <span className="btn-icon">✎</span>
                      </button>
                      {hasLyrics(song) && (
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDeleteLyrics(song)}
                          title="Xóa lyrics"
                        >
                          <span className="btn-icon">✕</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Lyrics Editor Modal */}
      {showEditor && selectedSong && (
        <div className="modal-overlay">
          <LyricsEditor
            song={selectedSong}
            onSave={handleEditorSave}
            onClose={handleEditorClose}
          />
        </div>
      )}
      </div>
    </div>
  );
};

export default LyricsAdmin;
