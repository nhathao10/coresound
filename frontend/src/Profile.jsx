import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { usePlayer } from './PlayerContext';
import Header from './Header';
import PremiumModal from './PremiumModal';
import { FaMusic, FaClock, FaHeart, FaList, FaEdit, FaChartLine, FaTimes, FaSave, FaSync, FaCrown } from 'react-icons/fa';

const Profile = () => {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const { setQueueAndPlay } = usePlayer();
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [stats, setStats] = useState(null);
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    gender: '',
    dateOfBirth: '',
    avatar: null
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

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
      
      // Auto refresh stats when entering profile
      refreshAllData();
    }
  }, [user]);

  const fetchUserStats = async () => {
    try {
      const token = user?.token || (localStorage.getItem('cs_user') ? JSON.parse(localStorage.getItem('cs_user')).token : null);
      const response = await fetch('http://localhost:5000/api/history/stats?period=30', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchUserPlaylists = async () => {
    try {
      const token = user?.token || (localStorage.getItem('cs_user') ? JSON.parse(localStorage.getItem('cs_user')).token : null);
      const response = await fetch('http://localhost:5000/api/user-playlists', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserPlaylists(data || []);
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
    }
  };

  const fetchFavoritesCount = async () => {
    try {
      const token = user?.token || (localStorage.getItem('cs_user') ? JSON.parse(localStorage.getItem('cs_user')).token : null);
      const response = await fetch('http://localhost:5000/api/favorites?type=song', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFavoritesCount(data.favorites?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const refreshAllData = async () => {
    setLoadingStats(true);
    await Promise.all([
      fetchUserStats(),
      fetchUserPlaylists(),
      fetchFavoritesCount()
    ]);
    setLoadingStats(false);
  };

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
      if (data.user.avatar) {
        setAvatarPreview(data.user.avatar);
      } else {
        setAvatarPreview(null);
      }
      
      // Exit edit mode
      setEditMode(false);

    } catch (error) {
      console.error('Profile update error:', error);
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      showError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError('Mật khẩu mới không khớp');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    setPasswordLoading(true);

    try {
      const token = user?.token || (localStorage.getItem('cs_user') ? JSON.parse(localStorage.getItem('cs_user')).token : null);
      const response = await fetch('http://localhost:5000/api/profile/change-password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(passwordData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Không thể đổi mật khẩu');
      }

      showSuccess('Đổi mật khẩu thành công!');
      
      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowChangePassword(false);

    } catch (error) {
      console.error('Password change error:', error);
      showError(error.message);
    } finally {
      setPasswordLoading(false);
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
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem',
        marginTop: '6rem',
        marginBottom: '120px'
      }}>
        {/* Back Button */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '2rem'
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

        {!editMode ? (
          /* Profile View */
          <div>
            {/* Banner Profile */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              overflow: 'hidden',
              marginBottom: '2rem'
            }}>
              {/* Banner */}
              <div style={{
                height: '200px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  bottom: '-60px',
                  left: '2rem',
                  width: '140px',
                  height: '140px',
                  borderRadius: '50%',
                  background: !avatarPreview ? 'linear-gradient(135deg, #1db954, #1ed760)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '3.5rem',
                  fontWeight: '700',
                  overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                  border: '4px solid #1a1a1f'
                }}>
                  {avatarPreview ? (
                    <img
                      src={avatarPreview.startsWith('http') ? avatarPreview : `http://localhost:5000${avatarPreview}`}
                      alt="Avatar"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    user?.name?.charAt(0)?.toUpperCase() || 'U'
                  )}
                </div>
              </div>
              
              {/* User Info */}
              <div style={{ padding: '4rem 2rem 2rem 2rem', position: 'relative' }}>
                {/* Edit Button on Banner */}
                {!editMode && (
                  <button
                    onClick={() => setEditMode(true)}
                    style={{
                      position: 'absolute',
                      top: '2rem',
                      right: '2rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      background: 'rgba(29, 185, 84, 0.9)',
                      backdropFilter: 'blur(10px)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(30, 215, 96, 0.95)';
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(29, 185, 84, 0.9)';
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
                    }}
                  >
                    <FaEdit /> Chỉnh sửa hồ sơ
                  </button>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                  <h2 style={{ color: '#fff', fontSize: '2.5rem', fontWeight: '700', margin: 0 }}>
                    {user?.name || 'Người dùng'}
                  </h2>
                  {user?.isPremium && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      background: 'linear-gradient(135deg, #ffd700, #ffed4e)',
                      borderRadius: '20px',
                      boxShadow: '0 4px 12px rgba(255, 215, 0, 0.3)'
                    }}>
                      <FaCrown style={{ color: '#000', fontSize: '1rem' }} />
                      <span style={{ color: '#000', fontSize: '0.9rem', fontWeight: '700' }}>
                        Premium
                      </span>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1db954' }}></div>
                    <p style={{ color: '#b3b3b3', fontSize: '0.95rem', margin: 0 }}>
                      {user?.email}
                    </p>
                  </div>
                  {user?.gender && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8a2be2' }}></div>
                      <p style={{ color: '#b3b3b3', fontSize: '0.95rem', margin: 0 }}>
                        {user.gender === 'male' ? 'Nam' : user.gender === 'female' ? 'Nữ' : 'Khác'}
                      </p>
                    </div>
                  )}
                  {user?.dateOfBirth && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff4500' }}></div>
                      <p style={{ color: '#b3b3b3', fontSize: '0.95rem', margin: 0 }}>
                        {new Date(user.dateOfBirth).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Premium Upgrade Button */}
            {!user?.isPremium && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 215, 0, 0.05))',
                borderRadius: '16px',
                border: '2px solid rgba(255, 215, 0, 0.3)',
                padding: '2rem',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1.5rem'
              }}>
                <div style={{ flex: 1, minWidth: '250px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <FaCrown style={{ color: '#ffd700', fontSize: '2rem' }} />
                    <h3 style={{ color: '#fff', fontSize: '1.8rem', fontWeight: '700', margin: 0 }}>
                      Nâng cấp lên Premium
                    </h3>
                  </div>
                  <p style={{ color: '#b3b3b3', fontSize: '1rem', margin: 0, lineHeight: 1.6 }}>
                    Trải nghiệm âm nhạc không giới hạn với chất lượng cao nhất.<br/>
                    Không quảng cáo, tải offline và nhiều tính năng độc quyền khác.
                  </p>
                </div>
                <button
                  onClick={() => setShowPremiumModal(true)}
                  style={{
                    padding: '1rem 2rem',
                    background: 'linear-gradient(135deg, #ffd700, #ffed4e)',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#000',
                    fontSize: '1.1rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 16px rgba(255, 215, 0, 0.4)',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 16px rgba(255, 215, 0, 0.4)';
                  }}
                >
                  <FaCrown style={{ marginRight: '0.5rem' }} />
                  Nâng cấp ngay
                </button>
              </div>
            )}

            {/* Premium Info for Premium Users */}
            {user?.isPremium && user?.premiumExpiresAt && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 215, 0, 0.05))',
                borderRadius: '16px',
                border: '2px solid rgba(255, 215, 0, 0.3)',
                padding: '2rem',
                marginBottom: '2rem',
                textAlign: 'center'
              }}>
                <FaCrown style={{ color: '#ffd700', fontSize: '3rem', marginBottom: '1rem' }} />
                <h3 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: '700', margin: '0 0 0.5rem 0' }}>
                  Bạn đang là thành viên Premium
                </h3>
                <p style={{ color: '#b3b3b3', fontSize: '1rem', margin: 0 }}>
                  Gói Premium của bạn sẽ hết hạn vào: {new Date(user.premiumExpiresAt).toLocaleDateString('vi-VN')}
                </p>
              </div>
            )}

            {/* Stats Cards */}
            {loadingStats ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#b3b3b3' }}>
                Đang tải thống kê...
              </div>
            ) : stats ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(29, 185, 84, 0.1), rgba(30, 215, 96, 0.05))',
                  borderRadius: '12px',
                  border: '1px solid rgba(29, 185, 84, 0.2)',
                  padding: '1.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <FaClock style={{ color: '#1db954', fontSize: '1.5rem' }} />
                    <h3 style={{ color: '#fff', fontSize: '1rem', fontWeight: '600', margin: 0 }}>
                      Thời gian nghe
                    </h3>
                  </div>
                  <p style={{ color: '#1db954', fontSize: '2rem', fontWeight: '700', margin: 0 }}>
                    {stats.totalListeningTime > 0 ? formatDuration(stats.totalListeningTime) : '0m'}
                  </p>
                  <p style={{ color: '#b3b3b3', fontSize: '0.85rem', margin: '0.5rem 0 0 0' }}>
                    Trong 30 ngày qua
                  </p>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, rgba(138, 43, 226, 0.1), rgba(186, 85, 211, 0.05))',
                  borderRadius: '12px',
                  border: '1px solid rgba(138, 43, 226, 0.2)',
                  padding: '1.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <FaMusic style={{ color: '#8a2be2', fontSize: '1.5rem' }} />
                    <h3 style={{ color: '#fff', fontSize: '1rem', fontWeight: '600', margin: 0 }}>
                      Bài hát đã nghe
                    </h3>
                  </div>
                  <p style={{ color: '#8a2be2', fontSize: '2rem', fontWeight: '700', margin: 0 }}>
                    {stats.dailyActivity?.reduce((sum, day) => sum + day.count, 0) || 0}
                  </p>
                  <p style={{ color: '#b3b3b3', fontSize: '0.85rem', margin: '0.5rem 0 0 0' }}>
                    Lượt phát
                  </p>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, rgba(255, 69, 0, 0.1), rgba(255, 140, 0, 0.05))',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 69, 0, 0.2)',
                  padding: '1.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <FaList style={{ color: '#ff4500', fontSize: '1.5rem' }} />
                    <h3 style={{ color: '#fff', fontSize: '1rem', fontWeight: '600', margin: 0 }}>
                      Playlist của bạn
                    </h3>
                  </div>
                  <p style={{ color: '#ff4500', fontSize: '2rem', fontWeight: '700', margin: 0 }}>
                    {userPlaylists.length}
                  </p>
                  <p style={{ color: '#b3b3b3', fontSize: '0.85rem', margin: '0.5rem 0 0 0' }}>
                    Playlist đã tạo
                  </p>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(244, 114, 182, 0.05))',
                  borderRadius: '12px',
                  border: '1px solid rgba(236, 72, 153, 0.2)',
                  padding: '1.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <FaHeart style={{ color: '#ec4899', fontSize: '1.5rem' }} />
                    <h3 style={{ color: '#fff', fontSize: '1rem', fontWeight: '600', margin: 0 }}>
                      Yêu thích
                    </h3>
                  </div>
                  <p style={{ color: '#ec4899', fontSize: '2rem', fontWeight: '700', margin: 0 }}>
                    {favoritesCount}
                  </p>
                  <p style={{ color: '#b3b3b3', fontSize: '0.85rem', margin: '0.5rem 0 0 0' }}>
                    Bài hát yêu thích
                  </p>
                </div>
              </div>
            ) : null}

            {/* Top Most Played Songs */}
            {stats?.mostPlayedSongs && stats.mostPlayedSongs.length > 0 && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '2rem',
                marginBottom: '2rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <FaChartLine style={{ color: '#1db954', fontSize: '1.5rem' }} />
                    <h3 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>
                      Top bài hát yêu thích
                    </h3>
                  </div>
                  <span style={{ color: '#b3b3b3', fontSize: '0.9rem' }}>
                    30 ngày qua
                  </span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {stats.mostPlayedSongs.map((item, index) => (
                    <div
                      key={item.song._id}
                      onClick={() => {
                        const songs = stats.mostPlayedSongs.map(s => s.song);
                        setQueueAndPlay(songs, index, 'profile-top-songs');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1rem',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(29, 185, 84, 0.1)';
                        e.currentTarget.style.transform = 'translateX(8px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        background: index < 3 ? 'linear-gradient(135deg, #ffd700, #ffed4e)' : 'rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.2rem',
                        fontWeight: '700',
                        color: index < 3 ? '#000' : '#fff'
                      }}>
                        {index + 1}
                      </div>
                      
                      {item.song?.cover ? (
                        <img
                          src={item.song.cover.startsWith('http') ? item.song.cover : `http://localhost:5000${item.song.cover}`}
                          alt={item.song.title}
                          style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '8px',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #1db954, #1ed760)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <FaMusic style={{ color: '#fff', fontSize: '1.5rem' }} />
                        </div>
                      )}
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: '#fff', fontSize: '1.05rem', fontWeight: '600', margin: '0 0 0.35rem 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.song?.title || 'Không rõ'}
                        </p>
                        <p style={{ color: '#b3b3b3', fontSize: '0.9rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.song?.artist || 'Không rõ'}
                        </p>
                      </div>
                      
                      <div style={{
                        background: 'rgba(29, 185, 84, 0.2)',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '20px',
                        border: '1px solid rgba(29, 185, 84, 0.3)'
                      }}>
                        <p style={{ color: '#1db954', fontSize: '0.9rem', margin: 0, fontWeight: '600' }}>
                          {item.count} lượt phát
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* User Playlists */}
            {userPlaylists.length > 0 && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '2rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <FaList style={{ color: '#ff4500', fontSize: '1.5rem' }} />
                    <h3 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>
                      Playlist của bạn
                    </h3>
                  </div>
                  <button
                    onClick={() => window.location.hash = '#/library'}
                    style={{
                      background: 'rgba(255, 69, 0, 0.2)',
                      border: '1px solid rgba(255, 69, 0, 0.3)',
                      borderRadius: '20px',
                      padding: '0.5rem 1rem',
                      color: '#ff4500',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(255, 69, 0, 0.3)'}
                    onMouseLeave={(e) => e.target.style.background = 'rgba(255, 69, 0, 0.2)'}
                  >
                    Xem tất cả
                  </button>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                  {userPlaylists.slice(0, 4).map((playlist) => (
                    <div
                      key={playlist._id}
                      onClick={() => window.location.hash = `#/playlist/${playlist._id}`}
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        padding: '1rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.transform = 'translateY(-4px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      {playlist.cover ? (
                        <img
                          src={playlist.cover.startsWith('http') ? playlist.cover : `http://localhost:5000${playlist.cover}`}
                          alt={playlist.name}
                          style={{
                            width: '100%',
                            aspectRatio: '1',
                            borderRadius: '8px',
                            objectFit: 'cover',
                            marginBottom: '0.75rem'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '100%',
                          aspectRatio: '1',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #667eea, #764ba2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '0.75rem'
                        }}>
                          <FaList style={{ color: '#fff', fontSize: '2rem' }} />
                        </div>
                      )}
                      <p style={{ color: '#fff', fontSize: '1rem', fontWeight: '600', margin: '0 0 0.25rem 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {playlist.name}
                      </p>
                      <p style={{ color: '#b3b3b3', fontSize: '0.85rem', margin: 0 }}>
                        {playlist.songs?.length || 0} bài hát
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Change Password Section */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '1.5rem',
              marginTop: '2rem'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <h3 style={{
                  color: '#fff',
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  margin: 0
                }}>
                  Bảo mật
                </h3>
                {!showChangePassword && (
                  <button
                    onClick={() => setShowChangePassword(true)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'rgba(29, 185, 84, 0.1)',
                      border: '1px solid rgba(29, 185, 84, 0.3)',
                      borderRadius: '8px',
                      color: '#1db954',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(29, 185, 84, 0.2)';
                      e.target.style.borderColor = 'rgba(29, 185, 84, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(29, 185, 84, 0.1)';
                      e.target.style.borderColor = 'rgba(29, 185, 84, 0.3)';
                    }}
                  >
                    Đổi mật khẩu
                  </button>
                )}
              </div>

              {showChangePassword ? (
                <form onSubmit={handlePasswordSubmit} style={{ marginTop: '1.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Current Password */}
                    <div>
                      <label style={{
                        display: 'block',
                        color: '#fff',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        marginBottom: '0.5rem'
                      }}>
                        Mật khẩu hiện tại *
                      </label>
                      <input
                        type="password"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        required
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '0.95rem',
                          outline: 'none',
                          transition: 'all 0.2s ease'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#1db954';
                          e.target.style.background = 'rgba(29, 185, 84, 0.05)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                          e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                        }}
                      />
                    </div>

                    {/* New Password */}
                    <div>
                      <label style={{
                        display: 'block',
                        color: '#fff',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        marginBottom: '0.5rem'
                      }}>
                        Mật khẩu mới *
                      </label>
                      <input
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        required
                        minLength={6}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '0.95rem',
                          outline: 'none',
                          transition: 'all 0.2s ease'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#1db954';
                          e.target.style.background = 'rgba(29, 185, 84, 0.05)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                          e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                        }}
                      />
                      <small style={{ color: '#b3b3b3', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                        Ít nhất 6 ký tự
                      </small>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label style={{
                        display: 'block',
                        color: '#fff',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        marginBottom: '0.5rem'
                      }}>
                        Xác nhận mật khẩu mới *
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        required
                        minLength={6}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '0.95rem',
                          outline: 'none',
                          transition: 'all 0.2s ease'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#1db954';
                          e.target.style.background = 'rgba(29, 185, 84, 0.05)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                          e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                        }}
                      />
                    </div>

                    {/* Buttons */}
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setShowChangePassword(false);
                          setPasswordData({
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: ''
                          });
                        }}
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          color: '#b3b3b3',
                          fontSize: '0.95rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                          e.target.style.color = '#fff';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                          e.target.style.color = '#b3b3b3';
                        }}
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={passwordLoading}
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          background: passwordLoading ? 'rgba(29, 185, 84, 0.5)' : '#1db954',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '0.95rem',
                          fontWeight: '600',
                          cursor: passwordLoading ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!passwordLoading) {
                            e.target.style.background = '#1ed760';
                            e.target.style.transform = 'translateY(-1px)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!passwordLoading) {
                            e.target.style.background = '#1db954';
                            e.target.style.transform = 'translateY(0)';
                          }
                        }}
                      >
                        {passwordLoading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <p style={{ color: '#b3b3b3', fontSize: '0.9rem', margin: 0 }}>
                  Giữ tài khoản của bạn an toàn bằng cách thay đổi mật khẩu định kỳ
                </p>
              )}
            </div>
          </div>
        ) : (
          /* Edit Profile Form */
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
              onClick={() => setEditMode(false)}
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
        )}
      </div>

      {/* Premium Modal */}
      <PremiumModal 
        isOpen={showPremiumModal} 
        onClose={() => setShowPremiumModal(false)} 
      />
    </div>
  );
};

export default Profile;
