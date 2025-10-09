import React, { useState } from 'react';
import GenreFilter from './GenreFilter';
import FilteredSongs from './FilteredSongs';
import Header from './Header';
import { usePlayer } from './PlayerContext';
import './GenreBrowser.css';

const GenreBrowser = () => {
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [filteredSongs, setFilteredSongs] = useState([]);
  const { setQueueAndPlay, setQueueContext } = usePlayer();

  const handleFilterChange = (newSelectedGenres) => {
    setSelectedGenres(newSelectedGenres);
  };

  const handleSongSelect = (song) => {
    // Tìm index của bài hát trong danh sách đã lọc
    const songIndex = filteredSongs.findIndex(s => s._id === song._id);
    
    if (songIndex !== -1 && filteredSongs.length > 0) {
      // Phát từ danh sách đã lọc theo thể loại
      setQueueAndPlay(filteredSongs, songIndex);
      setQueueContext("genre-filter");
    } else {
      // Fallback: phát bài hát đơn lẻ
      setQueueAndPlay([song], 0);
      setQueueContext("genre-filter");
    }
  };

  const handleSongsUpdate = (songs) => {
    setFilteredSongs(songs);
  };

  return (
    <div className="music-app dark-theme">
      <Header 
        showSearch={true}
        showSearchResults={false}
      />
      
      <main className="main-content">
        <div className="genre-browser">
          <div className="genre-browser-header">
            <h1>Khám phá theo thể loại</h1>
            <p>Tìm kiếm và khám phá bài hát theo thể loại yêu thích của bạn</p>
          </div>
          
          <div className="genre-browser-content">
            <div className="filter-sidebar">
              <GenreFilter 
                onFilterChange={handleFilterChange}
                selectedGenres={selectedGenres}
              />
            </div>
            
            <div className="songs-main">
              <FilteredSongs 
                selectedGenres={selectedGenres}
                onSongSelect={handleSongSelect}
                onSongsUpdate={handleSongsUpdate}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GenreBrowser;
