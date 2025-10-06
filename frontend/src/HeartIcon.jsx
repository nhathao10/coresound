import { useState } from 'react';
import { FaHeart } from 'react-icons/fa';
import { useFavorites } from './FavoritesContext';
import { useToast } from './ToastContext';

const HeartIcon = ({ type, itemId, size = '1.2rem', style = {} }) => {
  const { isFavorited, toggleFavorite } = useFavorites();
  const { showSuccess, showError } = useToast();
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isCurrentlyFavorited = isFavorited(type, itemId);

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      const result = await toggleFavorite(type, itemId);
      
      if (result.success) {
        showSuccess(result.message);
      } else {
        showError(result.error);
      }
    } catch (error) {
      showError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: '8px',
        right: '8px',
        zIndex: 10,
        opacity: isHovered ? 1 : 0,
        transition: 'opacity 0.3s ease',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        ...style
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          transition: 'all 0.2s ease',
          transform: isLoading ? 'scale(0.9)' : 'scale(1)',
          opacity: isLoading ? 0.7 : 1
        }}
      >
        <FaHeart
          size="0.9rem"
          color={isCurrentlyFavorited ? '#ff6b6b' : '#fff'}
          style={{
            filter: isCurrentlyFavorited 
              ? 'drop-shadow(0 0 4px rgba(255, 107, 107, 0.8))' 
              : 'drop-shadow(0 0 2px rgba(0, 0, 0, 0.3))',
            transition: 'all 0.2s ease'
          }}
        />
      </div>
    </div>
  );
};

export default HeartIcon;
