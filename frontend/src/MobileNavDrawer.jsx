import React, { useState } from 'react';
import { FaTimes, FaHome, FaMusic, FaHeart, FaBook, FaUser, FaCog, FaSignOutAlt, FaUserShield } from 'react-icons/fa';
import { useAuth } from './AuthContext';
import LoginModal from './LoginModal';
import SignupModal from './SignupModal';

const MobileNavDrawer = ({ isOpen, onClose }) => {
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);

  const handleNavigation = (path) => {
    window.location.hash = path;
    onClose();
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay - only covers the right side, below header */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: '80px',
          left: '280px',
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9998,
          animation: 'fadeIn 0.3s ease-out',
          pointerEvents: 'auto'
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '280px',
          maxWidth: '80vw',
          background: 'linear-gradient(135deg, #1e1e24 0%, #2a2a35 100%)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '4px 0 24px rgba(0, 0, 0, 0.5)',
          animation: 'slideInLeft 0.3s ease-out',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.5rem 1rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <span
            className="logo-gradient"
            style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #1db954, #1ed760)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            CoreSound
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
            }}
          >
            <FaTimes />
          </button>
        </div>

        {/* User Info */}
        {isAuthenticated && user && (
          <>
            <div
              style={{
                padding: '1.5rem 1rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                background: 'rgba(29, 185, 84, 0.05)'
              }}
            >
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: user?.avatar
                    ? `url(${user.avatar.startsWith('http') ? user.avatar : `${import.meta.env.VITE_API_URL}${user.avatar}`})`
                    : 'linear-gradient(135deg, #1db954, #1ed760)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  border: '2px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                {!user?.avatar && (user?.name?.charAt(0)?.toUpperCase() || 'U')}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: '600',
                    marginBottom: '0.25rem'
                  }}
                >
                  {user?.name}
                </div>
                <div
                  style={{
                    color: '#1db954',
                    fontSize: '0.85rem',
                    fontWeight: '500'
                  }}
                >
                  {isAdmin ? 'Quản trị viên' : 'Người dùng'}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Auth Buttons for non-authenticated users */}
        {!isAuthenticated && (
          <div
            style={{
              padding: '1.5rem 1rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}
          >
            <button
              onClick={() => {
                setShowLoginModal(true);
                onClose();
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'linear-gradient(135deg, #1db954, #1ed760)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Đăng nhập
            </button>
            <button
              onClick={() => {
                setShowSignupModal(true);
                onClose();
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Đăng ký
            </button>
          </div>
        )}

        {/* Navigation Menu */}
        <nav style={{ flex: 1, padding: '1rem 0' }}>
          {/* Home */}
          <NavItem
            icon={<FaHome />}
            label="Trang chủ"
            onClick={() => handleNavigation('#/')}
            active={window.location.hash === '#/' || window.location.hash === ''}
          />

          {/* Genres */}
          <NavItem
            icon={<FaMusic />}
            label="Thể loại"
            onClick={() => handleNavigation('#/genres')}
            active={window.location.hash.startsWith('#/genres')}
          />

          {isAuthenticated && (
            <>
              {/* Favorites */}
              <NavItem
                icon={<FaHeart />}
                label="Yêu thích"
                onClick={() => handleNavigation('#/favorites')}
                active={window.location.hash.startsWith('#/favorites')}
              />

              {/* Library */}
              <NavItem
                icon={<FaBook />}
                label="Thư viện"
                onClick={() => handleNavigation('#/library')}
                active={window.location.hash.startsWith('#/library')}
              />

              {/* Profile */}
              <NavItem
                icon={<FaUser />}
                label="Hồ sơ"
                onClick={() => handleNavigation('#/profile')}
                active={window.location.hash.startsWith('#/profile')}
              />

              {/* Admin Panel */}
              {isAdmin && (
                <NavItem
                  icon={<FaUserShield />}
                  label="Bảng quản trị"
                  onClick={() => handleNavigation('#/upload')}
                  active={window.location.hash.startsWith('#/upload') || 
                         window.location.hash.includes('-admin')}
                />
              )}
            </>
          )}
        </nav>

        {/* Footer */}
        {isAuthenticated && (
          <div
            style={{
              padding: '1rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.02)'
            }}
          >
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255, 107, 107, 0.1)',
                border: '1px solid rgba(255, 107, 107, 0.3)',
                borderRadius: '8px',
                color: '#ff6b6b',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 107, 107, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 107, 107, 0.1)';
              }}
            >
              <FaSignOutAlt />
              Đăng xuất
            </button>
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes slideInLeft {
            from { transform: translateX(-100%); }
            to { transform: translateX(0); }
          }
        `}
      </style>

      {/* Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToSignup={() => {
          setShowLoginModal(false);
          setShowSignupModal(true);
        }}
      />

      <SignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onSwitchToLogin={() => {
          setShowSignupModal(false);
          setShowLoginModal(true);
        }}
      />
    </>
  );
};

// Navigation Item Component
const NavItem = ({ icon, label, onClick, active }) => {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '0.875rem 1.5rem',
        color: active ? '#1db954' : '#b3b3b3',
        fontSize: '0.95rem',
        fontWeight: active ? '600' : '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        background: active ? 'rgba(29, 185, 84, 0.1)' : 'transparent',
        borderLeft: active ? '3px solid #1db954' : '3px solid transparent'
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          e.currentTarget.style.color = '#fff';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = '#b3b3b3';
        }
      }}
    >
      <span style={{ fontSize: '1.25rem' }}>{icon}</span>
      <span>{label}</span>
    </div>
  );
};

export default MobileNavDrawer;

