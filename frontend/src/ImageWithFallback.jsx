import React, { useState } from 'react';
import { getImageUrl } from './utils/imageUtils';

const ImageWithFallback = ({ 
  src, 
  alt, 
  className = '', 
  fallbackSrc = null,
  onError = null,
  ...props 
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = (e) => {
    setImageError(true);
    setIsLoading(false);
    if (onError) {
      onError(e);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
    setImageError(false);
  };

  const imageSrc = imageError ? fallbackSrc : getImageUrl(src);

  // Custom fallback component
  const FallbackComponent = () => (
    <div 
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #2a2a35 0%, #1a1a20 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#b3b3b3',
        fontSize: '14px',
        fontWeight: '500'
      }}
    >
      <div style={{
        width: '48px',
        height: '48px',
        background: 'rgba(29, 185, 84, 0.2)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '8px',
        fontSize: '20px'
      }}>
        🎵
      </div>
      <span style={{ fontSize: '12px', opacity: 0.8 }}>No Image</span>
    </div>
  );

  return (
    <div className={`image-container ${className}`} style={{ position: 'relative', width: '100%', height: '100%' }}>
      {isLoading && !imageError && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, #2a2a35 0%, #1a1a20 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#b3b3b3',
            fontSize: '12px',
            zIndex: 1
          }}
        >
          <div style={{
            width: '24px',
            height: '24px',
            border: '2px solid #2e2e37',
            borderTop: '2px solid #1db954',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
      )}
      
      {imageError && !fallbackSrc ? (
        <FallbackComponent />
      ) : (
        <img
          src={imageSrc}
          alt={alt}
          onError={handleError}
          onLoad={handleLoad}
          style={{
            opacity: isLoading ? 0 : 1,
            transition: 'opacity 0.3s ease',
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
          {...props}
        />
      )}
    </div>
  );
};

export default ImageWithFallback;
