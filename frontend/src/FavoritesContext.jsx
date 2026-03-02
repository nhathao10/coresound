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
      
      // Load regular favorites (songs, albums)
      const favoritesResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/favorites`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      let allFavorites = [];
      if (favoritesResponse.ok) {
        const favoritesData = await favoritesResponse.json();
        allFavorites = favoritesData.favorites || [];
      }

      // Load podcast favorites
      const podcastsResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/podcasts/favorites`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (podcastsResponse.ok) {
        const podcastsData = await podcastsResponse.json();
        const podcastFavorites = (podcastsData.podcasts || []).map(podcast => ({
          type: 'podcast',
          item: podcast
        }));
        allFavorites = [...allFavorites, ...podcastFavorites];
      }

      setFavorites(allFavorites);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if item is favorited
  const isFavorited = (type, itemId) => {
    return favorites.some(fav => fav.type === type && fav.item && fav.item._id === itemId);
  };

  // Add item to favorites
  const addToFavorites = async (type, itemId) => {
    if (!isAuthenticated) {
      throw new Error('Bạn cần đăng nhập để thêm vào yêu thích');
    }

    try {
      const token = user?.token;
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/favorites`, {
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
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/favorites/item/${type}/${itemId}`, {
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
      setFavorites(prev => prev.filter(fav => !(fav.type === type && fav.item && fav.item._id === itemId)));
      
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
      showError('Bạn cần đăng nhập để sử dụng tính năng yêu thích');
      return { success: false, error: 'Auth required' };
    }

    // Handle podcast separately (already has its own logic)
    if (type === 'podcast') {
      return await togglePodcastFavorite(itemId);
    }

    const isCurrentlyFavorited = isFavorited(type, itemId);
    const previousFavorites = [...favorites];

    // --- OPTIMISTIC UPDATE ---
    if (isCurrentlyFavorited) {
      setFavorites(prev => prev.filter(fav => !(fav.type === type && fav.item && fav.item._id === itemId)));
    } else {
      // Find the item in local songs/albums if possible to make the UI look complete
      // We'll add a temporary placeholder if we can't find it
      setFavorites(prev => [...prev, { type, item: { _id: itemId }, createdAt: new Date() }]);
    }

    try {
      const token = user?.token;
      let response;
      
      if (isCurrentlyFavorited) {
        response = await fetch(`${import.meta.env.VITE_API_URL}/api/favorites/item/${type}/${itemId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } else {
        response = await fetch(`${import.meta.env.VITE_API_URL}/api/favorites`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ type, itemId })
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Lỗi server');
      }

      // Sync local state with actual server data (e.g., to get the real item object from backend)
      if (!isCurrentlyFavorited && data.favorite) {
        setFavorites(prev => prev.map(fav => 
          (fav.type === type && fav.item && fav.item._id === itemId) ? data.favorite : fav
        ));
      }
      
      return { success: true };
    } catch (error) {
      console.error('Favorite toggle error:', error);
      // --- ROLLBACK ---
      setFavorites(previousFavorites);
      showError(error.message || 'Không thể cập nhật yêu thích');
      return { success: false, error: error.message };
    }
  };

  // Toggle podcast favorite using dedicated API
  const togglePodcastFavorite = async (podcastId) => {
    try {
      const token = user?.token;
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/podcasts/${podcastId}/favorite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Không thể cập nhật yêu thích');
      }

      // Reload favorites to sync with backend
      await loadFavorites();
      
      return { 
        success: true, 
        message: data.isFavorite ? 'Đã thêm podcast vào yêu thích!' : 'Đã xóa podcast khỏi yêu thích!' 
      };
    } catch (error) {
      console.error('Error toggling podcast favorite:', error);
      return { success: false, error: error.message };
    }
  };

  // Get favorites by type
  const getFavoritesByType = (type) => {
    return favorites.filter(fav => fav.type === type);
  };

  // Get favorite songs
  const getFavoriteSongs = () => {
    return getFavoritesByType('song').map(fav => fav.item).filter(item => item);
  };

  // Get favorite albums
  const getFavoriteAlbums = () => {
    return getFavoritesByType('album').map(fav => fav.item).filter(item => item);
  };

  // Get favorite podcasts
  const getFavoritePodcasts = () => {
    return getFavoritesByType('podcast').map(fav => fav.item).filter(item => item);
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
    getFavoritePodcasts,
    loadFavorites
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};
