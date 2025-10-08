import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const FavoritesContext = createContext();

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { showSuccess, showError } = useToast();
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load favorites when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      loadFavorites();
    } else {
      setFavorites([]);
    }
  }, [isAuthenticated, user]);

  // Load user's favorites
  const loadFavorites = async () => {
    try {
      setIsLoading(true);
      const token = user?.token;
      
      const response = await fetch('http://localhost:5000/api/favorites', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFavorites(data.favorites || []);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if item is favorited
  const isFavorited = (type, itemId) => {
    return favorites.some(fav => fav.type === type && fav.item._id === itemId);
  };

  // Add item to favorites
  const addToFavorites = async (type, itemId) => {
    if (!isAuthenticated) {
      throw new Error('Bạn cần đăng nhập để thêm vào yêu thích');
    }

    try {
      const token = user?.token;
      
      const response = await fetch('http://localhost:5000/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type, itemId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Không thể thêm vào yêu thích');
      }

      // Add to local state
      setFavorites(prev => [...prev, data.favorite]);
      
      return { success: true, message: data.message };
    } catch (error) {
      console.error('Error adding to favorites:', error);
      return { success: false, error: error.message };
    }
  };

  // Remove item from favorites
  const removeFromFavorites = async (type, itemId) => {
    if (!isAuthenticated) {
      throw new Error('Bạn cần đăng nhập để xóa khỏi yêu thích');
    }

    try {
      const token = user?.token;
      
      const response = await fetch(`http://localhost:5000/api/favorites/item/${type}/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Không thể xóa khỏi yêu thích');
      }

      // Remove from local state
      setFavorites(prev => prev.filter(fav => !(fav.type === type && fav.item._id === itemId)));
      
      return { success: true, message: data.message || 'Đã xóa khỏi danh sách yêu thích' };
    } catch (error) {
      console.error('Error removing from favorites:', error);
      showError(error.message || 'Lỗi khi xóa khỏi danh sách yêu thích');
      return { success: false, error: error.message };
    }
  };

  // Toggle favorite status
  const toggleFavorite = async (type, itemId) => {
    if (!isAuthenticated) {
      throw new Error('Bạn cần đăng nhập để sử dụng tính năng yêu thích');
    }

    const isCurrentlyFavorited = isFavorited(type, itemId);
    
    if (isCurrentlyFavorited) {
      return await removeFromFavorites(type, itemId);
    } else {
      return await addToFavorites(type, itemId);
    }
  };

  // Get favorites by type
  const getFavoritesByType = (type) => {
    return favorites.filter(fav => fav.type === type);
  };

  // Get favorite songs
  const getFavoriteSongs = () => {
    return getFavoritesByType('song').map(fav => fav.item);
  };

  // Get favorite albums
  const getFavoriteAlbums = () => {
    return getFavoritesByType('album').map(fav => fav.item);
  };

  const value = {
    favorites,
    isLoading,
    isFavorited,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    getFavoritesByType,
    getFavoriteSongs,
    getFavoriteAlbums,
    loadFavorites
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};
