import { createContext, useContext, useState, useEffect } from 'react';

const SearchContext = createContext();

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

export const SearchProvider = ({ children }) => {
  const [searchHistory, setSearchHistory] = useState([]);

  // Load search history from localStorage
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('cs_search_history');
      if (savedHistory) {
        const history = JSON.parse(savedHistory);
        if (Array.isArray(history)) {
          setSearchHistory(history);
        }
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  }, []);

  // Save search history to localStorage
  const saveSearchHistory = (history) => {
    try {
      localStorage.setItem('cs_search_history', JSON.stringify(history));
      setSearchHistory(history);
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  };

  // Add song to search history
  const addToSearchHistory = (song) => {
    const newHistory = searchHistory.filter(item => item._id !== song._id);
    newHistory.unshift(song);
    const limitedHistory = newHistory.slice(0, 10); // Keep only 10 recent searches
    saveSearchHistory(limitedHistory);
  };

  // Remove song from search history
  const removeFromSearchHistory = (songId) => {
    const newHistory = searchHistory.filter(item => item._id !== songId);
    saveSearchHistory(newHistory);
  };

  // Clear all search history
  const clearSearchHistory = () => {
    saveSearchHistory([]);
  };

  const value = {
    searchHistory,
    addToSearchHistory,
    removeFromSearchHistory,
    clearSearchHistory
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};
