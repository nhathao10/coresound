import React, { useState, useEffect } from 'react';
import { getImageUrl, handleImageError } from './utils/imageUtils';
import './GenreFilter.css';

const GenreFilter = ({ onFilterChange, selectedGenres = [], className = "" }) => {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch genres từ API
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/genres`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setGenres(data);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching genres:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGenres();
  }, []);

  // Xử lý khi user chọn/bỏ chọn thể loại
  const handleGenreToggle = (genreId) => {
    let newSelectedGenres;
    
    if (selectedGenres.includes(genreId)) {
      // Bỏ chọn thể loại
      newSelectedGenres = selectedGenres.filter(id => id !== genreId);
    } else {
      // Chọn thể loại
      newSelectedGenres = [...selectedGenres, genreId];
    }
    
    onFilterChange(newSelectedGenres);
  };

  // Xóa tất cả filter
  const clearAllFilters = () => {
    onFilterChange([]);
  };

  if (loading) {
    return (
      <div className={`genre-filter ${className}`}>
        <div className="genre-filter-header">
          <h3>Thể loại</h3>
        </div>
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`genre-filter ${className}`}>
        <div className="genre-filter-header">
          <h3>Thể loại</h3>
        </div>
        <div className="error">Lỗi: {error}</div>
      </div>
    );
  }

  return (
    <div className={`genre-filter ${className}`}>
      <div className="genre-filter-header">
        <h3>Thể loại</h3>
        {selectedGenres.length > 0 && (
          <button 
            className="clear-filters-btn"
            onClick={clearAllFilters}
            title="Xóa tất cả bộ lọc"
          >
            Xóa tất cả
          </button>
        )}
      </div>
      
      <div className="genre-list">
        {genres.map((genre) => (
          <div
            key={genre._id}
            className={`genre-item ${selectedGenres.includes(genre._id) ? 'selected' : ''}`}
            onClick={() => handleGenreToggle(genre._id)}
          >
            <div className="genre-checkbox">
              <input
                type="checkbox"
                checked={selectedGenres.includes(genre._id)}
                onChange={() => handleGenreToggle(genre._id)}
                className="checkbox-input"
              />
              <span className="checkbox-custom"></span>
            </div>
            
            <div className="genre-info">
              <span className="genre-name">{genre.name}</span>
              {genre.description && (
                <span className="genre-description">{genre.description}</span>
              )}
            </div>
            
            {genre.cover && (
              <div className="genre-cover">
                <img 
                  src={getImageUrl(genre.cover)} 
                  alt={genre.name}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      
      {selectedGenres.length > 0 && (
        <div className="selected-count">
          Đã chọn {selectedGenres.length} thể loại
        </div>
      )}
    </div>
  );
};

export default GenreFilter;
