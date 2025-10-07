import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const SearchContext = createContext();

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

export const SearchProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [searchHistory, setSearchHistory] = useState([]);

  // Get localStorage key for current user
  const getSearchHistoryKey = useCallback(() => {
    if (user && user._id) {
      return `cs_search_history_${user._id}`;
    }
    return 'cs_search_history_guest'; // For non-authenticated users
  }, [user?._id]);

  // Load search history from localStorage when user changes
  useEffect(() => {
    try {
      const key = getSearchHistoryKey();
      let savedHistory = localStorage.getItem(key);
      
      // If no user-specific history exists, try to migrate from old global history
      if (!savedHistory && user && user._id) {
        const oldHistory = localStorage.getItem('cs_search_history');
        if (oldHistory) {
          // Migrate old history to user-specific key
          localStorage.setItem(key, oldHistory);
          savedHistory = oldHistory;
          // Remove old global history
          localStorage.removeItem('cs_search_history');
        }
      }
      
      if (savedHistory) {
        const history = JSON.parse(savedHistory);
        if (Array.isArray(history)) {
          setSearchHistory(history);
        }
      } else {
        setSearchHistory([]); // Clear history when switching users
      }
    } catch (error) {
      console.error('Error loading search history:', error);
      setSearchHistory([]);
    }
  }, [getSearchHistoryKey, isAuthenticated, user?._id]); // Reload when user ID changes

  // Clear search history when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setSearchHistory([]);
    }
  }, [isAuthenticated]);

  // Save search history to localStorage
  const saveSearchHistory = (history) => {
    try {
      const key = getSearchHistoryKey();
      localStorage.setItem(key, JSON.stringify(history));
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
