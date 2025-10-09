import React, { useState } from 'react';
import { getImageUrl } from './utils/imageUtils';

const ImageWithFallback = ({ 
  src, 
  alt, 
  className = '', 
  fallbackSrc = '/default-album.svg',
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

  return (
    <div className={`image-container ${className}`} style={{ position: 'relative' }}>
      {isLoading && !imageError && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: '#2a2a35',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#b3b3b3',
            fontSize: '12px'
          }}
        >
          Loading...
        </div>
      )}
      <img
        src={imageSrc}
        alt={alt}
        onError={handleError}
        onLoad={handleLoad}
        style={{
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s ease'
        }}
        {...props}
      />
    </div>
  );
};

export default ImageWithFallback;
