import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const FollowButton = ({ artist, onFollowChange }) => {
  const { user, isAuthenticated, updateUserFollowedArtists } = useAuth();
  const { showSuccess, showError } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user is following this artist
  useEffect(() => {
    if (isAuthenticated && user?.followedArtists) {
      setIsFollowing(user.followedArtists.includes(artist._id));
    }
  }, [isAuthenticated, user?.followedArtists, artist._id]);

  const handleFollowToggle = async () => {
    if (!isAuthenticated) {
      showError('Vui lòng đăng nhập để theo dõi nghệ sĩ');
      return;
    }

    setIsLoading(true);
    
    try {
      const token = user?.token;
      const endpoint = isFollowing ? 'unfollow' : 'follow';
      
      const response = await fetch(`http://localhost:5000/api/artists/${artist._id}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const newFollowingState = !isFollowing;
        setIsFollowing(newFollowingState);
        
        // Update user's followed artists in AuthContext
        updateUserFollowedArtists(artist._id, newFollowingState);
        
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('followStatusChanged', {
          detail: { artistId: artist._id, isFollowing: newFollowingState }
        }));
        
        const message = isFollowing ? 'Đã bỏ theo dõi nghệ sĩ' : 'Đã theo dõi nghệ sĩ';
        showSuccess(message);
        onFollowChange && onFollowChange(artist._id, newFollowingState);
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Lỗi khi thay đổi trạng thái theo dõi');
      }
    } catch (error) {
      console.error('Follow toggle error:', error);
      showError(error.message || 'Lỗi khi thay đổi trạng thái theo dõi');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <button
      onClick={handleFollowToggle}
      disabled={isLoading}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        background: isFollowing ? 'rgba(255, 0, 0, 0.1)' : 'rgba(29, 185, 84, 0.1)',
        color: isFollowing ? '#ff4444' : '#1db954',
        border: `1px solid ${isFollowing ? '#ff4444' : '#1db954'}`,
        borderRadius: '20px',
        fontSize: '0.9rem',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s ease',
        opacity: isLoading ? 0.7 : 1
      }}
      onMouseEnter={(e) => {
        if (!isLoading) {
          e.target.style.background = isFollowing ? '#ff4444' : '#1db954';
          e.target.style.color = 'white';
        }
      }}
      onMouseLeave={(e) => {
        if (!isLoading) {
          e.target.style.background = isFollowing ? 'rgba(255, 0, 0, 0.1)' : 'rgba(29, 185, 84, 0.1)';
          e.target.style.color = isFollowing ? '#ff4444' : '#1db954';
        }
      }}
    >
      {isFollowing ? (
        <>
          {isLoading ? 'Đang xử lý...' : 'Bỏ theo dõi'}
        </>
      ) : (
        <>
          {isLoading ? 'Đang xử lý...' : 'Theo dõi'}
        </>
      )}
    </button>
  );
};

export default FollowButton;
