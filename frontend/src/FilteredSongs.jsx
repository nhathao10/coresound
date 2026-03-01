import React, { useState, useEffect } from 'react';
import ImageWithFallback from './ImageWithFallback';
import CustomDropdown from './CustomDropdown';
import './FilteredSongs.css';

const FilteredSongs = ({ selectedGenres, onSongSelect, onSongsUpdate }) => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalSongs: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [sortBy, setSortBy] = useState('weeklyPlays');
  const [sortOrder, setSortOrder] = useState('desc');

  // Sort options for dropdown
  const sortOptions = [
    { value: 'createdAt-desc', label: 'Mới nhất' },
    { value: 'createdAt-asc', label: 'Cũ nhất' },
    { value: 'weeklyPlays-desc', label: 'Nghe nhiều nhất' },
    { value: 'weeklyPlays-asc', label: 'Nghe ít nhất' },
    { value: 'plays-desc', label: 'Tổng lượt nghe cao' },
    { value: 'plays-asc', label: 'Tổng lượt nghe thấp' },
    { value: 'title-asc', label: 'Tên A-Z' },
    { value: 'title-desc', label: 'Tên Z-A' }
  ];

  // Fetch songs khi selectedGenres thay đổi
  useEffect(() => {
    if (selectedGenres.length > 0) {
      fetchSongs(1); // Reset về trang 1 khi filter thay đổi
    } else {
      setSongs([]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalSongs: 0,
        hasNextPage: false,
        hasPrevPage: false
      });
    }
  }, [selectedGenres, sortBy, sortOrder]);

  const fetchSongs = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        genres: selectedGenres.join(','),
        page: page.toString(),
        limit: '20',
        sortBy,
        sortOrder
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/songs/filter/by-genres?${params}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      const songsData = data.songs || [];
      setSongs(songsData);
      setPagination(data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalSongs: 0,
        hasNextPage: false,
        hasPrevPage: false
      });
      
      // Gọi callback để cập nhật danh sách bài hát cho parent component
      if (onSongsUpdate) {
        onSongsUpdate(songsData);
      }
    } catch (err) {
      console.error('Error fetching filtered songs:', err);
      setError(`Lỗi kết nối: ${err.message}. Vui lòng kiểm tra backend server.`);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchSongs(newPage);
    }
  };

  const handleSortChange = (sortValue) => {
    const [newSortBy, newSortOrder] = sortValue.split('-');
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  const formatPlayCount = (count) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  };

  if (selectedGenres.length === 0) {
    return (
      <div className="filtered-songs">
        <div className="no-filter-message">
          <h3>Chọn thể loại để xem bài hát</h3>
          <p>Hãy chọn một hoặc nhiều thể loại từ danh sách bên trái để xem các bài hát tương ứng.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="filtered-songs">
      <div className="songs-header">
        <div className="songs-title">
          <h3>Bài hát theo thể loại</h3>
          <span className="songs-count">
            {pagination.totalSongs} bài hát
          </span>
        </div>
        
        <div className="sort-controls">
          <span>Sắp xếp theo:</span>
          <CustomDropdown
            options={sortOptions}
            value={`${sortBy}-${sortOrder}`}
            onChange={handleSortChange}
            className="sort-dropdown"
          />
        </div>
      </div>

      {loading && (
        <div className="loading">
          <div className="loading-spinner"></div>
          <span>Đang tải bài hát...</span>
        </div>
      )}

      {error && (
        <div className="error">
          <p>Lỗi: {error}</p>
          <button onClick={() => fetchSongs(pagination.currentPage)}>
            Thử lại
          </button>
        </div>
      )}

      {!loading && !error && songs.length === 0 && (
        <div className="no-songs">
          <h4>Không tìm thấy bài hát</h4>
          <p>Không có bài hát nào thuộc các thể loại đã chọn.</p>
        </div>
      )}

      {!loading && !error && songs.length > 0 && (
        <>
          <div className="songs-grid">
            {songs.map((song) => (
              <div 
                key={song._id} 
                className="song-card"
                onClick={() => onSongSelect && onSongSelect(song)}
              >
                <div className="song-cover">
                  <ImageWithFallback 
                    src={song.cover} 
                    alt={song.title}
                    className="song-cover-img"
                  />
                  <div className="play-overlay">
                    <div className="play-button">▶</div>
                  </div>
                </div>
                
                <div className="song-info">
                  <h4 className="song-title" title={song.title}>
                    {song.title}
                  </h4>
                  <p className="song-artist" title={song.artist}>
                    {song.artist}
                  </p>
                  
                  <div className="song-genres">
                    {song.genres && song.genres.slice(0, 2).map((genre) => (
                      <span key={genre._id} className="genre-tag">
                        {genre.name}
                      </span>
                    ))}
                    {song.genres && song.genres.length > 2 && (
                      <span className="genre-tag more">
                        +{song.genres.length - 2}
                      </span>
                    )}
                  </div>
                  
                  <div className="song-stats">
                    <span className="play-count">
                      {formatPlayCount(song.plays || 0)} lượt nghe
                    </span>
                    {song.weeklyPlays > 0 && (
                      <span className="weekly-plays">
                        {formatPlayCount(song.weeklyPlays)} tuần này
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage}
                className="pagination-btn"
              >
                Trước
              </button>
              
              <div className="pagination-info">
                Trang {pagination.currentPage} / {pagination.totalPages}
              </div>
              
              <button 
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="pagination-btn"
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FilteredSongs;
