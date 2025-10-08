import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import Header from './Header';

const Profile = () => {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    gender: '',
    dateOfBirth: '',
    avatar: null
  });
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    if (user) {
      // Format date for input field (YYYY-MM-DD)
      let formattedDate = '';
      if (user.dateOfBirth) {
        const date = new Date(user.dateOfBirth);
        if (!isNaN(date.getTime())) {
          formattedDate = date.toISOString().split('T')[0];
        }
      }
      
      setFormData({
        name: user.name || '',
        email: user.email || '',
        gender: user.gender || '',
        dateOfBirth: formattedDate,
        avatar: null
      });
      setAvatarPreview(user.avatar || null);
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showError('Kích thước ảnh không được vượt quá 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        showError('Vui lòng chọn file ảnh hợp lệ');
        return;
      }

      setFormData(prev => ({
        ...prev,
        avatar: file
      }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('gender', formData.gender);
      formDataToSend.append('dateOfBirth', formData.dateOfBirth);
      
      if (formData.avatar) {
        formDataToSend.append('avatar', formData.avatar);
      }

      const token = user?.token || (localStorage.getItem('cs_user') ? JSON.parse(localStorage.getItem('cs_user')).token : null);
      
      const response = await fetch('http://localhost:5000/api/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Cập nhật thông tin thất bại');
      }

      showSuccess('Cập nhật thông tin thành công');
      
      // Update user data in localStorage
      const updatedUser = { ...user, ...data.user };
      localStorage.setItem('cs_user', JSON.stringify(updatedUser));
      
      // Refresh user context
      refreshUser();
      
      // Update avatar preview
      console.log('Profile update response:', data.user);
      if (data.user.avatar) {
        setAvatarPreview(data.user.avatar);
      } else {
        setAvatarPreview(null);
      }

    } catch (error) {
      console.error('Profile update error:', error);
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        color: '#fff',
        fontSize: '1.2rem'
      }}>
        Vui lòng đăng nhập để xem hồ sơ
      </div>
    );
  }

  return (
    <div className="music-app dark-theme">
      <Header />
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '2rem',
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        marginTop: '6rem', // Thêm margin-top để tránh bị header che
        marginBottom: '120px' // Thêm margin-bottom để tránh bị music player che
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '2rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <button
            onClick={() => window.location.hash = '#/'}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '0.5rem',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.15)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            ←
          </button>
          <h1 style={{
            color: '#fff',
            fontSize: '2rem',
            fontWeight: '700',
            margin: 0,
            background: 'linear-gradient(135deg, #1db954, #1ed760)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Hồ sơ cá nhân
          </h1>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit}>
          {/* Avatar Section */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2rem',
            marginBottom: '2rem',
            padding: '1.5rem',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            {/* Avatar Display */}
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: !avatarPreview ? 'linear-gradient(135deg, #1db954, #1ed760)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '3rem',
                fontWeight: '600',
                border: 'none',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                overflow: 'hidden',
                position: 'relative',
                zIndex: 1
              }}>
                {avatarPreview ? (
                  <img
                    src={avatarPreview.startsWith('http') ? avatarPreview : `http://localhost:5000${avatarPreview}`}
                    alt="Avatar"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '50%'
                    }}
                  />
                ) : (
                  formData.name?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || 'U'
                )}
              </div>
              
              {/* Upload Button */}
              <label style={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                background: '#1db954',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1rem',
                boxShadow: '0 4px 12px rgba(29, 185, 84, 0.3)',
                transition: 'all 0.2s ease',
                zIndex: 10
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#1ed760';
                e.target.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#1db954';
                e.target.style.transform = 'scale(1)';
              }}
              >
                +
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
              </label>

            </div>

            {/* Avatar Info */}
            <div>
              <h3 style={{
                color: '#fff',
                fontSize: '1.2rem',
                fontWeight: '600',
                margin: '0 0 0.5rem 0'
              }}>
                Ảnh đại diện
              </h3>
              <p style={{
                color: '#b3b3b3',
                fontSize: '0.9rem',
                margin: 0,
                lineHeight: 1.4
              }}>
                Nhấn vào nút + để thay đổi ảnh đại diện.<br/>
                Ảnh cũ sẽ được tự động xóa khi upload ảnh mới.<br/>
                Kích thước tối đa: 5MB
              </p>
            </div>
          </div>

          {/* Form Fields */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {/* Name */}
            <div>
              <label style={{
                display: 'block',
                color: '#fff',
                fontSize: '0.9rem',
                fontWeight: '600',
                marginBottom: '0.5rem'
              }}>
                Họ và tên *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))',
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: '500',
                  boxSizing: 'border-box',
                  transition: 'all 0.3s ease',
                  boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.1)',
                  backdropFilter: 'blur(10px)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#1db954';
                  e.target.style.background = 'linear-gradient(145deg, rgba(29, 185, 84, 0.15), rgba(29, 185, 84, 0.05))';
                  e.target.style.boxShadow = '0 0 0 3px rgba(29, 185, 84, 0.1), inset 0 1px 3px rgba(0, 0, 0, 0.1)';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  e.target.style.background = 'linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))';
                  e.target.style.boxShadow = 'inset 0 1px 3px rgba(0, 0, 0, 0.1)';
                  e.target.style.transform = 'translateY(0)';
                }}
                onMouseEnter={(e) => {
                  if (document.activeElement !== e.target) {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                    e.target.style.background = 'linear-gradient(145deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06))';
                  }
                }}
                onMouseLeave={(e) => {
                  if (document.activeElement !== e.target) {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                    e.target.style.background = 'linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))';
                  }
                }}
                placeholder="Nhập họ và tên"
              />
            </div>

            {/* Email */}
            <div>
              <label style={{
                display: 'block',
                color: '#fff',
                fontSize: '0.9rem',
                fontWeight: '600',
                marginBottom: '0.5rem'
              }}>
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))',
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: '500',
                  boxSizing: 'border-box',
                  transition: 'all 0.3s ease',
                  boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.1)',
                  backdropFilter: 'blur(10px)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#1db954';
                  e.target.style.background = 'linear-gradient(145deg, rgba(29, 185, 84, 0.15), rgba(29, 185, 84, 0.05))';
                  e.target.style.boxShadow = '0 0 0 3px rgba(29, 185, 84, 0.1), inset 0 1px 3px rgba(0, 0, 0, 0.1)';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  e.target.style.background = 'linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))';
                  e.target.style.boxShadow = 'inset 0 1px 3px rgba(0, 0, 0, 0.1)';
                  e.target.style.transform = 'translateY(0)';
                }}
                onMouseEnter={(e) => {
                  if (document.activeElement !== e.target) {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                    e.target.style.background = 'linear-gradient(145deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06))';
                  }
                }}
                onMouseLeave={(e) => {
                  if (document.activeElement !== e.target) {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                    e.target.style.background = 'linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))';
                  }
                }}
                placeholder="Nhập email"
              />
            </div>

            {/* Gender */}
            <div>
              <label style={{
                display: 'block',
                color: '#fff',
                fontSize: '0.9rem',
                fontWeight: '600',
                marginBottom: '0.5rem'
              }}>
                Giới tính
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem 3rem 0.75rem 1rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))',
                    color: formData.gender ? '#fff' : '#b3b3b3',
                    fontSize: '1rem',
                    fontWeight: '500',
                    boxSizing: 'border-box',
                    transition: 'all 0.3s ease',
                    appearance: 'none',
                    cursor: 'pointer',
                    boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.1)',
                    backdropFilter: 'blur(10px)'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#1db954';
                    e.target.style.background = 'linear-gradient(145deg, rgba(29, 185, 84, 0.15), rgba(29, 185, 84, 0.05))';
                    e.target.style.boxShadow = '0 0 0 3px rgba(29, 185, 84, 0.1), inset 0 1px 3px rgba(0, 0, 0, 0.1)';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                    e.target.style.background = 'linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))';
                    e.target.style.boxShadow = 'inset 0 1px 3px rgba(0, 0, 0, 0.1)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                      e.target.style.background = 'linear-gradient(145deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06))';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                      e.target.style.background = 'linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))';
                    }
                  }}
                >
                  <option value="" style={{ background: '#1e1e24', color: '#b3b3b3' }}>Chọn giới tính</option>
                  <option value="male" style={{ background: '#1e1e24', color: '#fff' }}>Nam</option>
                  <option value="female" style={{ background: '#1e1e24', color: '#fff' }}>Nữ</option>
                  <option value="other" style={{ background: '#1e1e24', color: '#fff' }}>Khác</option>
                </select>
                
                {/* Custom dropdown arrow */}
                <div style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: '#b3b3b3',
                  fontSize: '1.2rem',
                  transition: 'all 0.2s ease'
                }}>
                  ▼
                </div>
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label style={{
                display: 'block',
                color: '#fff',
                fontSize: '0.9rem',
                fontWeight: '600',
                marginBottom: '0.5rem'
              }}>
                Ngày sinh
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))',
                  color: formData.dateOfBirth ? '#fff' : '#b3b3b3',
                  fontSize: '1rem',
                  fontWeight: '500',
                  boxSizing: 'border-box',
                  transition: 'all 0.3s ease',
                  boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.1)',
                  backdropFilter: 'blur(10px)',
                  cursor: 'pointer'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#1db954';
                  e.target.style.background = 'linear-gradient(145deg, rgba(29, 185, 84, 0.15), rgba(29, 185, 84, 0.05))';
                  e.target.style.boxShadow = '0 0 0 3px rgba(29, 185, 84, 0.1), inset 0 1px 3px rgba(0, 0, 0, 0.1)';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  e.target.style.background = 'linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))';
                  e.target.style.boxShadow = 'inset 0 1px 3px rgba(0, 0, 0, 0.1)';
                  e.target.style.transform = 'translateY(0)';
                }}
                onMouseEnter={(e) => {
                  if (document.activeElement !== e.target) {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                    e.target.style.background = 'linear-gradient(145deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06))';
                  }
                }}
                onMouseLeave={(e) => {
                  if (document.activeElement !== e.target) {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                    e.target.style.background = 'linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))';
                  }
                }}
              />
            </div>

          </div>

          {/* Submit Button */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem'
          }}>
            <button
              type="button"
              onClick={() => window.location.hash = '#/'}
              style={{
                padding: '0.75rem 2rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: '#b3b3b3',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                e.target.style.color = '#fff';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                e.target.style.color = '#b3b3b3';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              Hủy
            </button>
            
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.75rem 2rem',
                background: loading ? 'rgba(29, 185, 84, 0.5)' : '#1db954',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 15px rgba(29, 185, 84, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.background = '#1ed760';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(29, 185, 84, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.background = '#1db954';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(29, 185, 84, 0.3)';
                }
              }}
            >
              {loading ? 'Đang cập nhật...' : 'Cập nhật hồ sơ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
