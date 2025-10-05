import { useState, useEffect } from 'react';

const Toast = ({ message, type = 'success', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onClose();
      }, 300); // Wait for animation to complete
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getToastStyle = () => {
    const baseStyle = {
      position: 'fixed',
      top: '16px',
      right: '16px',
      padding: '0.75rem 1rem',
      borderRadius: '8px',
      color: '#fff',
      fontSize: '0.85rem',
      fontWeight: '500',
      zIndex: 10001,
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      minWidth: '250px',
      maxWidth: '320px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
      backdropFilter: 'blur(12px)',
      transform: isVisible ? 'translateX(0) scale(1)' : 'translateX(120%) scale(0.8)',
      opacity: isVisible ? 1 : 0,
      transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      animation: isVisible ? 'toastSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none'
    };

    if (type === 'success') {
      return {
        ...baseStyle,
        background: 'linear-gradient(135deg, rgba(29, 185, 84, 0.9), rgba(30, 215, 96, 0.9))',
        borderColor: 'rgba(29, 185, 84, 0.3)'
      };
    } else if (type === 'error') {
      return {
        ...baseStyle,
        background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.9), rgba(255, 68, 68, 0.9))',
        borderColor: 'rgba(255, 107, 107, 0.3)'
      };
    } else if (type === 'info') {
      return {
        ...baseStyle,
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(37, 99, 235, 0.9))',
        borderColor: 'rgba(59, 130, 246, 0.3)'
      };
    }

    return baseStyle;
  };

  const getIcon = () => {
    if (type === 'success') {
      return (
        <div style={{
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          fontWeight: 'bold',
          flexShrink: 0
        }}>
          ✓
        </div>
      );
    } else if (type === 'error') {
      return (
        <div style={{
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          fontWeight: 'bold',
          flexShrink: 0
        }}>
          ✕
        </div>
      );
    } else if (type === 'info') {
      return (
        <div style={{
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          fontWeight: 'bold',
          flexShrink: 0
        }}>
          i
        </div>
      );
    }
    return null;
  };

  return (
    <div style={getToastStyle()}>
      {getIcon()}
      <span>{message}</span>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onClose(), 300);
        }}
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255, 255, 255, 0.6)',
          cursor: 'pointer',
          fontSize: '14px',
          padding: '2px',
          marginLeft: 'auto',
          transition: 'all 0.2s ease',
          borderRadius: '50%',
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
        onMouseEnter={(e) => {
          e.target.style.color = '#fff';
          e.target.style.background = 'rgba(255, 255, 255, 0.1)';
          e.target.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.target.style.color = 'rgba(255, 255, 255, 0.6)';
          e.target.style.background = 'none';
          e.target.style.transform = 'scale(1)';
        }}
      >
        ×
      </button>
    </div>
  );
};

export default Toast;
