import React, { useState, useEffect, useRef } from 'react';
import { FaBell, FaBellSlash, FaTimes, FaMusic, FaCompactDisc, FaUser } from 'react-icons/fa';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const NotificationBell = () => {
  const { user, isAuthenticated } = useAuth();
  const { showSuccess, showError } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load notifications
  useEffect(() => {
    if (isAuthenticated && user) {
      loadNotifications();
      // Set up polling for new notifications every 30 seconds
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user]);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId 
              ? { ...notif, isRead: true }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, isRead: true }))
        );
        setUnreadCount(0);
        showSuccess('Đã đánh dấu tất cả thông báo là đã đọc');
      }
    } catch (error) {
      showError('Lỗi khi đánh dấu thông báo');
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
        setUnreadCount(prev => Math.max(0, prev - 1));
        showSuccess('Đã xóa thông báo');
      }
    } catch (error) {
      showError('Lỗi khi xóa thông báo');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_song':
        return <FaMusic size="1rem" />;
      case 'new_album':
        return <FaCompactDisc size="1rem" />;
      case 'artist_update':
        return <FaUser size="1rem" />;
      default:
        return <FaBell size="1rem" />;
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInSeconds = Math.floor((now - notificationDate) / 1000);

    if (diffInSeconds < 60) return 'Vừa xong';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
    return notificationDate.toLocaleDateString('vi-VN');
  };

  if (!isAuthenticated) return null;

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          color: '#b3b3b3',
          cursor: 'pointer',
          padding: '0.75rem',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
          marginRight: '1rem'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.1)';
          e.target.style.color = 'white';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'none';
          e.target.style.color = '#b3b3b3';
        }}
      >
        <FaBell size="1.2rem" />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <div style={{
            position: 'absolute',
            top: '0.25rem',
            right: '0.25rem',
            background: 'linear-gradient(135deg, #ff3333 0%, #cc0000 100%)',
            color: 'white',
            borderRadius: '50%',
            width: '14px',
            height: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.65rem',
            fontWeight: '900',
            border: '1.5px solid #ffffff',
            boxShadow: '0 2px 8px rgba(255, 51, 51, 0.6), 0 0 0 1px rgba(0, 0, 0, 0.1)',
            animation: 'pulse 2s infinite',
            minWidth: '14px',
            minHeight: '14px',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: '0',
          width: '380px',
          maxHeight: '500px',
          background: 'linear-gradient(145deg, #2d2d2d 0%, #1e1e1e 50%, #1a1a1a 100%)',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          zIndex: 10002,
          overflow: 'hidden',
          animation: 'fadeInScale 0.25s ease-out'
        }}>
          {/* Header */}
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{
              color: 'white',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <FaBell size="1rem" />
              Thông báo
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  background: 'rgba(29, 185, 84, 0.2)',
                  border: '1px solid rgba(29, 185, 84, 0.3)',
                  color: '#1db954',
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(29, 185, 84, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(29, 185, 84, 0.2)';
                }}
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div style={{
            maxHeight: '400px',
            overflowY: 'auto',
            padding: '0.5rem 0'
          }}>
            {isLoading ? (
              <div style={{
                padding: '2rem',
                textAlign: 'center',
                color: '#b3b3b3'
              }}>
                Đang tải thông báo...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{
                padding: '2rem',
                textAlign: 'center',
                color: '#b3b3b3'
              }}>
                <FaBellSlash size="2rem" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p>Chưa có thông báo nào</p>
                <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  Thông báo về nghệ sĩ bạn theo dõi sẽ xuất hiện ở đây
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  style={{
                    padding: '1rem 1.5rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    background: notification.isRead 
                      ? 'transparent' 
                      : 'rgba(29, 185, 84, 0.05)',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = notification.isRead 
                      ? 'rgba(255, 255, 255, 0.05)' 
                      : 'rgba(29, 185, 84, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = notification.isRead 
                      ? 'transparent' 
                      : 'rgba(29, 185, 84, 0.05)';
                  }}
                  onClick={() => {
                    if (!notification.isRead) {
                      markAsRead(notification._id);
                    }
                  }}
                >
                  {/* Unread indicator */}
                  {!notification.isRead && (
                    <div style={{
                      position: 'absolute',
                      left: '0.5rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '6px',
                      height: '6px',
                      background: '#1db954',
                      borderRadius: '50%'
                    }} />
                  )}

                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem'
                  }}>
                    <div style={{
                      color: '#1db954',
                      marginTop: '0.2rem',
                      flexShrink: 0
                    }}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <p style={{
                        color: 'white',
                        fontSize: '0.95rem',
                        fontWeight: notification.isRead ? '400' : '600',
                        margin: 0,
                        marginBottom: '0.25rem',
                        lineHeight: '1.4'
                      }}>
                        {notification.title}
                      </p>
                      <p style={{
                        color: '#b3b3b3',
                        fontSize: '0.85rem',
                        margin: 0,
                        marginBottom: '0.5rem',
                        lineHeight: '1.3'
                      }}>
                        {notification.message}
                      </p>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{
                          color: '#888',
                          fontSize: '0.75rem'
                        }}>
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification._id);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#666',
                            cursor: 'pointer',
                            padding: '0.25rem',
                            borderRadius: '4px',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(255, 0, 0, 0.1)';
                            e.target.style.color = '#ff4444';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'none';
                            e.target.style.color = '#666';
                          }}
                        >
                          <FaTimes size="0.8rem" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationBell;
