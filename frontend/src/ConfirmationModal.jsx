import React from 'react';
import { FaExclamationTriangle, FaCheck, FaTimes } from 'react-icons/fa';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Xác nhận", 
  message, 
  confirmText = "Xác nhận", 
  cancelText = "Hủy",
  type = "warning" // warning, danger, info, success
}) => {
  if (!isOpen) return null;

  const getIconAndColors = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <FaExclamationTriangle size="2rem" />,
          iconColor: '#dc3545',
          confirmBg: '#dc3545',
          confirmHover: '#c82333'
        };
      case 'success':
        return {
          icon: <FaCheck size="2rem" />,
          iconColor: '#28a745',
          confirmBg: '#28a745',
          confirmHover: '#218838'
        };
      case 'info':
        return {
          icon: <FaExclamationTriangle size="2rem" />,
          iconColor: '#17a2b8',
          confirmBg: '#17a2b8',
          confirmHover: '#138496'
        };
      default: // warning
        return {
          icon: <FaExclamationTriangle size="2rem" />,
          iconColor: '#ffc107',
          confirmBg: '#ffc107',
          confirmHover: '#e0a800'
        };
    }
  };

  const { icon, iconColor, confirmBg, confirmHover } = getIconAndColors();

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      backdropFilter: 'blur(8px)',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        background: 'linear-gradient(145deg, #2d2d2d 0%, #1e1e1e 50%, #1a1a1a 100%)',
        borderRadius: '20px',
        padding: '2.5rem',
        maxWidth: '450px',
        width: '90%',
        boxShadow: `
          0 25px 80px rgba(0, 0, 0, 0.6),
          0 0 0 1px rgba(255, 255, 255, 0.05),
          inset 0 1px 0 rgba(255, 255, 255, 0.1)
        `,
        border: '1px solid rgba(255, 255, 255, 0.08)',
        animation: 'modalSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative background elements */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-50%',
          width: '200%',
          height: '200%',
          background: `radial-gradient(circle, ${iconColor}15 0%, transparent 70%)`,
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: `linear-gradient(90deg, transparent 0%, ${iconColor}40 50%, transparent 100%)`
        }} />
        
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: `${iconColor}20`,
              border: `2px solid ${iconColor}40`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              <span style={{ color: iconColor, position: 'relative', zIndex: 1 }}>
                {icon}
              </span>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: `${iconColor}10`,
                animation: 'pulse 2s infinite'
              }} />
            </div>
            <h3 style={{
              color: 'white',
              fontSize: '1.4rem',
              fontWeight: '700',
              margin: 0,
              letterSpacing: '0.5px'
            }}>
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#b3b3b3',
              cursor: 'pointer',
              padding: '0.75rem',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              e.target.style.color = 'white';
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.05)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.target.style.color = '#b3b3b3';
              e.target.style.transform = 'scale(1)';
            }}
          >
            <FaTimes size="1.1rem" />
          </button>
        </div>

        {/* Message */}
        <div style={{
          marginBottom: '2.5rem',
          position: 'relative',
          zIndex: 1
        }}>
          <p style={{
            color: '#e8e8e8',
            fontSize: '1.1rem',
            lineHeight: '1.6',
            margin: 0,
            textAlign: 'center',
            fontWeight: '400',
            letterSpacing: '0.3px'
          }}>
            {message}
          </p>
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: '1.25rem',
          justifyContent: 'flex-end',
          position: 'relative',
          zIndex: 1
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.875rem 2rem',
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#d0d0d0',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              minWidth: '100px',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.15)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.25)';
              e.target.style.color = 'white';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 25px rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.08)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
              e.target.style.color = '#d0d0d0';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            style={{
              padding: '0.875rem 2rem',
              background: `linear-gradient(135deg, ${confirmBg} 0%, ${confirmHover} 100%)`,
              color: type === 'warning' ? '#000' : 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              minWidth: '100px',
              boxShadow: `0 8px 25px ${confirmBg}50`,
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = `linear-gradient(135deg, ${confirmHover} 0%, ${confirmBg} 100%)`;
              e.target.style.transform = 'translateY(-3px) scale(1.02)';
              e.target.style.boxShadow = `0 12px 35px ${confirmBg}70`;
            }}
            onMouseLeave={(e) => {
              e.target.style.background = `linear-gradient(135deg, ${confirmBg} 0%, ${confirmHover} 100%)`;
              e.target.style.transform = 'translateY(0) scale(1)';
              e.target.style.boxShadow = `0 8px 25px ${confirmBg}50`;
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes modalSlideIn {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(-30px) rotateX(15deg);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.02) translateY(-5px) rotateX(0deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0) rotateX(0deg);
          }
        }
        
        @keyframes pulse {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.7;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.1);
            opacity: 0.3;
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
};

export default ConfirmationModal;
