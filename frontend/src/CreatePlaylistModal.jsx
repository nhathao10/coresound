import React, { useState, useRef, useEffect } from 'react';
import { FaTimes, FaUpload, FaMusic } from 'react-icons/fa';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import PremiumModal from './PremiumModal';

const CreatePlaylistModal = ({ isOpen, onClose, onSuccess, editingPlaylist }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: true
  });
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const fileInputRef = useRef(null);

  // Populate form when editing
  useEffect(() => {
    if (editingPlaylist) {
      setFormData({
        name: editingPlaylist.name || '',
        description: editingPlaylist.description || '',
        isPublic: editingPlaylist.isPublic !== undefined ? editingPlaylist.isPublic : true
      });
      setCoverPreview(editingPlaylist.cover ? `http://localhost:5000${editingPlaylist.cover}` : null);
    } else {
      setFormData({
        name: '',
        description: '',
        isPublic: true
      });
      setCoverPreview(null);
    }
    setCoverFile(null);
  }, [editingPlaylist]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setCoverPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveCover = () => {
    setCoverFile(null);
    setCoverPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showError('Tên playlist không được để trống');
      return;
    }

    setIsLoading(true);
    
    try {
      const token = user?.token;
      const formDataToSend = new FormData();
      
      formDataToSend.append('name', formData.name.trim());
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('isPublic', formData.isPublic);
      
      if (coverFile) {
        formDataToSend.append('cover', coverFile);
      }

      const url = editingPlaylist 
        ? `http://localhost:5000/api/user-playlists/${editingPlaylist._id}`
        : 'http://localhost:5000/api/user-playlists';
      
      const method = editingPlaylist ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if this is a playlist limit error for free users
        if (response.status === 403 && data.needsPremium) {
          showError(data.message || 'Bạn đã đạt giới hạn playlist miễn phí');
          setShowPremiumModal(true);
          return;
        }
        throw new Error(data.error || 'Lỗi khi tạo playlist');
      }

      showSuccess(editingPlaylist ? 'Cập nhật playlist thành công' : 'Tạo playlist thành công');
      onSuccess && onSuccess(data.playlist || data);
      handleClose();
      
    } catch (error) {
      console.error('Create playlist error:', error);
      showError(error.message || 'Lỗi khi tạo playlist');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      isPublic: true
    });
    setCoverFile(null);
    setCoverPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '1rem'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        borderRadius: '16px',
        padding: '2rem',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <h2 style={{
            color: 'white',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            margin: 0
          }}>
            {editingPlaylist ? 'Chỉnh sửa playlist' : 'Tạo playlist mới'}
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#b3b3b3',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease'
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
            <FaTimes size="1.2rem" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Cover Upload */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              color: 'white',
              fontSize: '1rem',
              fontWeight: '600',
              marginBottom: '1rem'
            }}>
              Ảnh bìa playlist
            </label>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem'
            }}>
              {/* Cover Preview */}
              <div style={{
                width: '120px',
                height: '120px',
                minWidth: '120px',
                borderRadius: '12px',
                background: coverPreview ? 
                  `url(${coverPreview}) center/cover` :
                  'linear-gradient(135deg, #1db954, #1ed760)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
              }}>
                {!coverPreview && (
                  <FaMusic size="2.5rem" color="white" style={{ opacity: 0.9 }} />
                )}
                
                {coverPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveCover}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      width: '28px',
                      height: '28px',
                      background: 'rgba(0, 0, 0, 0.8)',
                      border: 'none',
                      borderRadius: '50%',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(255, 68, 68, 0.9)';
                      e.target.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(0, 0, 0, 0.8)';
                      e.target.style.transform = 'scale(1)';
                    }}
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Upload Button Section */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: '0.75rem',
                flex: 1
              }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverChange}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.875rem 1.75rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    transition: 'all 0.3s ease',
                    width: 'fit-content'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <FaUpload size="1rem" />
                  {coverFile ? 'Thay đổi ảnh' : 'Chọn ảnh'}
                </button>
                <p style={{
                  color: '#b3b3b3',
                  fontSize: '0.85rem',
                  margin: 0,
                  lineHeight: '1.4'
                }}>
                  JPG, PNG tối đa 5MB
                </p>
              </div>
            </div>
          </div>

          {/* Name Input */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              color: 'white',
              fontSize: '1rem',
              fontWeight: '600',
              marginBottom: '0.5rem'
            }}>
              Tên playlist *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Nhập tên playlist"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#1db954';
                e.target.style.background = 'rgba(255, 255, 255, 0.15)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            />
          </div>

          {/* Description Input */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              color: 'white',
              fontSize: '1rem',
              fontWeight: '600',
              marginBottom: '0.5rem'
            }}>
              Mô tả
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Mô tả về playlist của bạn..."
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '1rem',
                outline: 'none',
                resize: 'vertical',
                minHeight: '80px',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#1db954';
                e.target.style.background = 'rgba(255, 255, 255, 0.15)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            />
          </div>

          {/* Public/Private Toggle */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: 'white',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                name="isPublic"
                checked={formData.isPublic}
                onChange={handleInputChange}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: '#1db954'
                }}
              />
              <span>Công khai playlist</span>
            </label>
            <p style={{
              color: '#b3b3b3',
              fontSize: '0.8rem',
              margin: '0.5rem 0 0 2rem'
            }}>
              Playlist công khai sẽ hiển thị cho tất cả người dùng
            </p>
          </div>

          {/* Submit Buttons */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={handleClose}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                padding: '0.75rem 1.5rem',
                background: isLoading ? '#666' : '#1db954',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.target.style.background = '#1ed760';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.target.style.background = '#1db954';
                }
              }}
            >
              {isLoading ? (editingPlaylist ? 'Đang cập nhật...' : 'Đang tạo...') : (editingPlaylist ? 'Cập nhật playlist' : 'Tạo playlist')}
            </button>
          </div>
        </form>
      </div>

      {/* Premium Modal */}
      <PremiumModal 
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
      />
    </div>
  );
};

export default CreatePlaylistModal;
