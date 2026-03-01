// Utility function để xử lý URL ảnh
export const getImageUrl = (imagePath) => {
  if (!imagePath) {
    return '/default-album.svg';
  }
  
  // Nếu là đường dẫn upload từ backend
  if (imagePath.startsWith('/uploads')) {
    const fullUrl = `${import.meta.env.VITE_API_URL}${imagePath}`;
    return fullUrl;
  }
  
  // Nếu đã là URL đầy đủ
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Nếu là đường dẫn tương đối
  return imagePath;
};

// Function để handle lỗi load ảnh
export const handleImageError = (e, fallbackSrc = '/default-album.svg') => {
  e.target.src = fallbackSrc;
};
