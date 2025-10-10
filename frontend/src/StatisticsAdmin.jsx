import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import AdminSidebar from './AdminSidebar';
// Removed Chart.js imports - using tables and cards instead

function StatisticsAdmin() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [topSongs, setTopSongs] = useState([]);
  const [genreStats, setGenreStats] = useState([]);
  const [artistStats, setArtistStats] = useState([]);
  const [userActivity, setUserActivity] = useState({ topListeners: [], topPlaylistCreators: [] });
  const [timeBasedStats, setTimeBasedStats] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchOverviewStats = useCallback(async () => {
    try {
      const token = user?.token || (localStorage.getItem('cs_user') ? JSON.parse(localStorage.getItem('cs_user')).token : null);
      const response = await fetch('http://localhost:5000/api/statistics/overview', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOverview(data.overview);
        setTopSongs(data.topSongs);
      } else {
        console.error('Overview API error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Lỗi khi lấy thống kê tổng quan:', error);
    }
  }, [user]);

  const fetchGenreStats = useCallback(async () => {
    try {
      const token = user?.token || (localStorage.getItem('cs_user') ? JSON.parse(localStorage.getItem('cs_user')).token : null);
      const response = await fetch('http://localhost:5000/api/statistics/by-genre', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setGenreStats(data);
      } else {
        console.error('Genre stats API error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Lỗi khi lấy thống kê thể loại:', error);
    }
  }, [user]);

  const fetchArtistStats = useCallback(async () => {
    try {
      const token = user?.token || (localStorage.getItem('cs_user') ? JSON.parse(localStorage.getItem('cs_user')).token : null);
      const response = await fetch('http://localhost:5000/api/statistics/by-artist', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setArtistStats(data);
      }
    } catch (error) {
      console.error('Lỗi khi lấy thống kê nghệ sĩ:', error);
    }
  }, [user]);

  const fetchUserActivity = useCallback(async () => {
    try {
      const token = user?.token || (localStorage.getItem('cs_user') ? JSON.parse(localStorage.getItem('cs_user')).token : null);
      const response = await fetch('http://localhost:5000/api/statistics/user-activity', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserActivity(data);
      }
    } catch (error) {
      console.error('Lỗi khi lấy thống kê người dùng:', error);
    }
  }, [user]);

  const fetchTimeBasedStats = useCallback(async (period) => {
    try {
      const token = user?.token || (localStorage.getItem('cs_user') ? JSON.parse(localStorage.getItem('cs_user')).token : null);
      const response = await fetch(`http://localhost:5000/api/statistics/time-based?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTimeBasedStats(data);
      }
    } catch (error) {
      console.error('Lỗi khi lấy thống kê theo thời gian:', error);
    }
  }, [user]);

  const fetchTopSongs = useCallback(async () => {
    try {
      const token = user?.token || (localStorage.getItem('cs_user') ? JSON.parse(localStorage.getItem('cs_user')).token : null);
      const response = await fetch('http://localhost:5000/api/statistics/top-songs', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTopSongs(data);
      }
    } catch (error) {
      console.error('Error fetching top songs:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchOverviewStats();
      fetchGenreStats();
      fetchArtistStats();
      fetchUserActivity();
      fetchTimeBasedStats(selectedPeriod);
      fetchTopSongs();
    }
  }, [user, selectedPeriod, fetchOverviewStats, fetchGenreStats, fetchArtistStats, fetchUserActivity, fetchTimeBasedStats, fetchTopSongs]);

  useEffect(() => {
    if (overview) {
      setLoading(false);
    }
  }, [overview]);


  if (!user || user.role !== 'admin') {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#e5e5e5' }}>
        <h2>Không có quyền truy cập</h2>
        <p>Chỉ admin mới có thể xem trang thống kê này.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#e5e5e5' }}>
        <h2>Đang tải thống kê...</h2>
      </div>
    );
  }

  const StatCard = ({ title, value, subtitle, icon }) => (
    <div style={{
      background: 'linear-gradient(145deg, #23232b 0%, #1e1e24 100%)',
      borderRadius: 16,
      padding: 24,
      border: '1px solid #2e2e37',
      minHeight: 140,
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 8px 30px rgba(29, 185, 84, 0.2)';
      e.currentTarget.style.borderColor = '#1db954';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
      e.currentTarget.style.borderColor = '#2e2e37';
    }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <div style={{
          background: 'linear-gradient(45deg, #1db954, #1ed760)',
          borderRadius: 12,
          padding: 12,
          marginRight: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span style={{ fontSize: 20, color: '#fff' }}>{icon}</span>
        </div>
        <h3 style={{ 
          margin: 0, 
          color: '#e5e5e5', 
          fontSize: 16,
          fontWeight: 600
        }}>
          {title}
        </h3>
      </div>
      <div style={{ 
        fontSize: 32, 
        fontWeight: 'bold', 
        color: '#1db954', 
        marginBottom: 8,
        textShadow: '0 2px 4px rgba(29, 185, 84, 0.3)'
      }}>
        {value?.toLocaleString() || 0}
      </div>
      {subtitle && (
        <div style={{ 
          fontSize: 14, 
          color: '#b3b3b3',
          opacity: 0.8
        }}>
          {subtitle}
        </div>
      )}
      {/* Decorative element */}
      <div style={{
        position: 'absolute',
        top: -20,
        right: -20,
        width: 60,
        height: 60,
        background: 'radial-gradient(circle, rgba(29, 185, 84, 0.1) 0%, transparent 70%)',
        borderRadius: '50%'
      }} />
    </div>
  );

  const formatDate = (dateObj) => {
    if (!dateObj) return '';
    const date = new Date(dateObj.year, dateObj.month - 1, dateObj.day);
    return date.toLocaleDateString('vi-VN');
  };

  const EmptyState = ({ icon, title, description, action }) => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      textAlign: 'center',
      minHeight: 200
    }}>
      <div style={{
        fontSize: 48,
        marginBottom: 16,
        opacity: 0.6
      }}>
        {icon}
      </div>
      <h3 style={{
        color: '#e5e5e5',
        fontSize: 18,
        fontWeight: 600,
        margin: '0 0 8px 0'
      }}>
        {title}
      </h3>
      <p style={{
        color: '#b3b3b3',
        fontSize: 14,
        margin: '0 0 16px 0',
        maxWidth: 300,
        lineHeight: 1.5
      }}>
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          style={{
            background: 'linear-gradient(45deg, #1db954, #1ed760)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
        >
          {action.text}
        </button>
      )}
    </div>
  );

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
      position: 'relative'
    }}>
      <AdminSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      {/* Header với menu button */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 60,
        background: 'rgba(15, 15, 15, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #2e2e37',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        zIndex: 100
      }}>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#e5e5e5',
            fontSize: 24,
            cursor: 'pointer',
            padding: 8,
            borderRadius: 8,
            marginRight: 16,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.target.style.background = '#2e2e37'}
          onMouseLeave={(e) => e.target.style.background = 'transparent'}
        >
          ☰
        </button>
        <h1 style={{ 
          color: '#e5e5e5', 
          margin: 0, 
          fontSize: 24,
          fontWeight: 700,
          background: 'linear-gradient(45deg, #1db954, #1ed760)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Thống kê hệ thống
        </h1>
      </div>

      {/* Main content */}
      <div style={{ 
        padding: '80px 20px 20px', 
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{ marginBottom: 30 }}>
          <p style={{ 
            color: '#b3b3b3', 
            margin: 0, 
            fontSize: 16,
            opacity: 0.8
          }}>
            Tổng quan về hoạt động của CoreSound
          </p>
        </div>

      {/* Thống kê tổng quan */}
      <div style={{ marginBottom: 50 }}>
        <h2 style={{ 
          color: '#e5e5e5', 
          marginBottom: 24,
          fontSize: 28,
          fontWeight: 700,
          position: 'relative',
          paddingBottom: 12
        }}>
          📊 Tổng quan
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: 60,
            height: 3,
            background: 'linear-gradient(45deg, #1db954, #1ed760)',
            borderRadius: 2
          }} />
        </h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: 20 
        }}>
          <StatCard 
            title="Tổng người dùng" 
            value={overview?.totalUsers} 
            icon="👥"
            subtitle={`+${overview?.newUsers || 0} người dùng mới (30 ngày)`}
          />
          <StatCard 
            title="Tổng bài hát" 
            value={overview?.totalSongs} 
            icon="🎵"
          />
          <StatCard 
            title="Tổng album" 
            value={overview?.totalAlbums} 
            icon="💿"
          />
          <StatCard 
            title="Tổng nghệ sĩ" 
            value={overview?.totalArtists} 
            icon="🎤"
          />
          <StatCard 
            title="Tổng playlist" 
            value={overview?.totalPlaylists} 
            icon="📋"
          />
          <StatCard 
            title="Tổng bình luận" 
            value={overview?.totalComments} 
            icon="💬"
          />
          <StatCard 
            title="Tổng đánh giá" 
            value={overview?.totalRatings} 
            icon="⭐"
          />
          <StatCard 
            title="Tổng yêu thích" 
            value={overview?.totalFavorites} 
            icon="❤️"
          />
        </div>
      </div>

      {/* Insights và Phân tích */}
      <div style={{ marginBottom: 50 }}>
        <h2 style={{ 
          color: '#e5e5e5', 
          marginBottom: 24,
          fontSize: 28,
          fontWeight: 700,
          position: 'relative',
          paddingBottom: 12
        }}>
          📊 Phân tích dữ liệu
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: 60,
            height: 3,
            background: 'linear-gradient(45deg, #1db954, #1ed760)',
            borderRadius: 2
          }} />
        </h2>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: 24 
        }}>
          {/* Top Thể loại */}
          <div style={{
            background: 'linear-gradient(145deg, #23232b 0%, #1e1e24 100%)',
            borderRadius: 16,
            padding: 24,
            border: '1px solid #2e2e37',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{ 
              color: '#e5e5e5', 
              marginBottom: 20,
              fontSize: 18,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              🎵 Top Thể loại
            </h3>
            {genreStats && genreStats.length > 0 ? (
              <div>
                {genreStats.slice(0, 5).map((genre, index) => (
                  <div key={genre._id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: index < 4 ? '1px solid #2e2e37' : 'none'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#1db954',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 'bold',
                        color: '#000'
                      }}>
                        {index + 1}
                      </div>
                      <span style={{ color: '#e5e5e5', fontSize: 14 }}>
                        {genre.genreName || genre._id}
                      </span>
                    </div>
                    <span style={{ 
                      color: '#1db954', 
                      fontWeight: 600,
                      fontSize: 14
                    }}>
                      {genre.songCount} bài
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon="🎵"
                title="Chưa có dữ liệu"
                description="Chưa có dữ liệu thể loại để hiển thị."
              />
            )}
          </div>

          {/* Top Nghệ sĩ */}
          <div style={{
            background: 'linear-gradient(145deg, #23232b 0%, #1e1e24 100%)',
            borderRadius: 16,
            padding: 24,
            border: '1px solid #2e2e37',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{ 
              color: '#e5e5e5', 
              marginBottom: 20,
              fontSize: 18,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              🎤 Top Nghệ sĩ
            </h3>
            {artistStats && artistStats.length > 0 ? (
              <div>
                {artistStats.slice(0, 5).map((artist, index) => (
                  <div key={artist._id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: index < 4 ? '1px solid #2e2e37' : 'none'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#1db954',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 'bold',
                        color: '#000'
                      }}>
                        {index + 1}
                      </div>
                      <span style={{ color: '#e5e5e5', fontSize: 14 }}>
                        {artist._id}
                      </span>
                    </div>
                    <span style={{ 
                      color: '#1db954', 
                      fontWeight: 600,
                      fontSize: 14
                    }}>
                      {artist.songCount} bài
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon="🎤"
                title="Chưa có dữ liệu"
                description="Chưa có dữ liệu nghệ sĩ để hiển thị."
              />
            )}
          </div>

          {/* Insights quan trọng */}
          <div style={{
            background: 'linear-gradient(145deg, #23232b 0%, #1e1e24 100%)',
            borderRadius: 16,
            padding: 24,
            border: '1px solid #2e2e37',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{ 
              color: '#e5e5e5', 
              marginBottom: 20,
              fontSize: 18,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              💡 Insights quan trọng
            </h3>
            {overview ? (
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: '1px solid #2e2e37'
                }}>
                  <div>
                    <div style={{ color: '#e5e5e5', fontSize: 14, fontWeight: 500 }}>Trung bình bài hát/album</div>
                    <div style={{ color: '#b3b3b3', fontSize: 12 }}>Hiệu quả sản xuất album</div>
                  </div>
                  <span style={{ color: '#1db954', fontWeight: 600, fontSize: 16 }}>
                    {overview.totalAlbums > 0 ? Math.round(overview.totalSongs / overview.totalAlbums) : 0}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: '1px solid #2e2e37'
                }}>
                  <div>
                    <div style={{ color: '#e5e5e5', fontSize: 14, fontWeight: 500 }}>Trung bình bài hát/nghệ sĩ</div>
                    <div style={{ color: '#b3b3b3', fontSize: 12 }}>Phân bố công việc nghệ sĩ</div>
                  </div>
                  <span style={{ color: '#1db954', fontWeight: 600, fontSize: 16 }}>
                    {overview.totalArtists > 0 ? Math.round(overview.totalSongs / overview.totalArtists) : 0}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: '1px solid #2e2e37'
                }}>
                  <div>
                    <div style={{ color: '#e5e5e5', fontSize: 14, fontWeight: 500 }}>Trung bình playlist/người dùng</div>
                    <div style={{ color: '#b3b3b3', fontSize: 12 }}>Mức độ tương tác người dùng</div>
                  </div>
                  <span style={{ color: '#1db954', fontWeight: 600, fontSize: 16 }}>
                    {overview.totalUsers > 0 ? Math.round(overview.totalPlaylists / overview.totalUsers) : 0}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0'
                }}>
                  <div>
                    <div style={{ color: '#e5e5e5', fontSize: 14, fontWeight: 500 }}>Trung bình yêu thích/người dùng</div>
                    <div style={{ color: '#b3b3b3', fontSize: 12 }}>Mức độ engagement</div>
                  </div>
                  <span style={{ color: '#1db954', fontWeight: 600, fontSize: 16 }}>
                    {overview.totalUsers > 0 ? Math.round(overview.totalFavorites / overview.totalUsers) : 0}
                  </span>
                </div>
              </div>
            ) : (
              <EmptyState
                icon="💡"
                title="Chưa có dữ liệu"
                description="Chưa có dữ liệu để tính toán insights."
              />
            )}
          </div>
        </div>
      </div>

      {/* Thống kê theo thời gian */}
      <div style={{ marginBottom: 50 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ 
            color: '#e5e5e5', 
            margin: 0,
            fontSize: 28,
            fontWeight: 700,
            position: 'relative',
            paddingBottom: 12
          }}>
            📊 Dữ liệu chi tiết
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: 60,
              height: 3,
              background: 'linear-gradient(45deg, #1db954, #1ed760)',
              borderRadius: 2
            }} />
          </h2>
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #2e2e37',
              background: '#23232b',
              color: '#e5e5e5',
              fontSize: 14
            }}
          >
            <option value="7d">7 ngày qua</option>
            <option value="30d">30 ngày qua</option>
            <option value="90d">90 ngày qua</option>
            <option value="1y">1 năm qua</option>
          </select>
        </div>
        
        {timeBasedStats ? (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', 
            gap: 24 
          }}>
            <div style={{
              background: 'linear-gradient(145deg, #23232b 0%, #1e1e24 100%)',
              borderRadius: 16,
              padding: 24,
              border: '1px solid #2e2e37',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
            }}>
              <h3 style={{ 
                color: '#e5e5e5', 
                marginBottom: 20,
                fontSize: 18,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                📈 Đăng ký người dùng
              </h3>
              {timeBasedStats.userRegistrations && timeBasedStats.userRegistrations.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #2e2e37' }}>
                        <th style={{ 
                          color: '#b3b3b3', 
                          textAlign: 'left', 
                          padding: '12px 8px',
                          fontSize: 14,
                          fontWeight: 600
                        }}>Ngày</th>
                        <th style={{ 
                          color: '#b3b3b3', 
                          textAlign: 'right', 
                          padding: '12px 8px',
                          fontSize: 14,
                          fontWeight: 600
                        }}>Số đăng ký</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timeBasedStats.userRegistrations.map((stat, index) => (
                        <tr key={stat._id} style={{ 
                          borderBottom: '1px solid #2e2e37'
                        }}>
                          <td style={{ 
                            color: '#e5e5e5', 
                            padding: '12px 8px',
                            fontSize: 14
                          }}>
                            {formatDate(stat._id)}
                          </td>
                          <td style={{ 
                            color: '#1db954', 
                            textAlign: 'right',
                            padding: '12px 8px',
                            fontSize: 14,
                            fontWeight: 600
                          }}>
                            {stat.count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  icon="📈"
                  title="Chưa có dữ liệu đăng ký"
                  description="Chưa có dữ liệu đăng ký người dùng trong khoảng thời gian này."
                />
              )}
            </div>
            
            <div style={{
              background: 'linear-gradient(145deg, #23232b 0%, #1e1e24 100%)',
              borderRadius: 16,
              padding: 24,
              border: '1px solid #2e2e37',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
            }}>
              <h3 style={{ 
                color: '#e5e5e5', 
                marginBottom: 20,
                fontSize: 18,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                🎵 Lượt nghe
              </h3>
              {timeBasedStats.listeningStats && timeBasedStats.listeningStats.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #2e2e37' }}>
                        <th style={{ 
                          color: '#b3b3b3', 
                          textAlign: 'left', 
                          padding: '12px 8px',
                          fontSize: 14,
                          fontWeight: 600
                        }}>Ngày</th>
                        <th style={{ 
                          color: '#b3b3b3', 
                          textAlign: 'right', 
                          padding: '12px 8px',
                          fontSize: 14,
                          fontWeight: 600
                        }}>Lượt nghe</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timeBasedStats.listeningStats.map((stat, index) => (
                        <tr key={stat._id} style={{ 
                          borderBottom: '1px solid #2e2e37'
                        }}>
                          <td style={{ 
                            color: '#e5e5e5', 
                            padding: '12px 8px',
                            fontSize: 14
                          }}>
                            {formatDate(stat._id)}
                          </td>
                          <td style={{ 
                            color: '#1ed760', 
                            textAlign: 'right',
                            padding: '12px 8px',
                            fontSize: 14,
                            fontWeight: 600
                          }}>
                            {stat.count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  icon="🎵"
                  title="Chưa có dữ liệu nghe"
                  description="Chưa có dữ liệu lượt nghe trong khoảng thời gian này."
                />
              )}
            </div>
          </div>
        ) : (
          <EmptyState
            icon="📈"
            title="Chưa có dữ liệu thời gian"
            description="Hệ thống chưa có dữ liệu thống kê theo thời gian. Hãy để người dùng hoạt động để xem thống kê."
          />
        )}
      </div>

      {/* Top bài hát */}
      <div style={{ marginBottom: 50 }}>
        <h2 style={{ 
          color: '#e5e5e5', 
          marginBottom: 24,
          fontSize: 28,
          fontWeight: 700,
          position: 'relative',
          paddingBottom: 12
        }}>
          🎵 Bài hát được nghe nhiều nhất
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: 60,
            height: 3,
            background: 'linear-gradient(45deg, #1db954, #1ed760)',
            borderRadius: 2
          }} />
        </h2>
        <div style={{
          background: '#23232b',
          borderRadius: 12,
          padding: 20,
          border: '1px solid #2e2e37'
        }}>
          {topSongs && topSongs.length > 0 ? (
            <div style={{ display: 'grid', gap: 12 }}>
              {topSongs.map((song, index) => (
                <div key={song._id} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '12px',
                  background: '#1a1a1d',
                  borderRadius: 8,
                  border: '1px solid #2e2e37'
                }}>
                  <span style={{ 
                    color: '#1db954', 
                    fontWeight: 'bold', 
                    marginRight: 16,
                    minWidth: 24
                  }}>
                    #{index + 1}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#e5e5e5', fontWeight: 'bold' }}>{song.title}</div>
                    <div style={{ color: '#b3b3b3', fontSize: 14 }}>{song.artist}</div>
                  </div>
                  <div style={{ color: '#1db954', fontWeight: 'bold' }}>
                    {song.playCount} lượt nghe
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="🎵"
              title="Chưa có bài hát nào"
              description="Hệ thống chưa có dữ liệu về bài hát được nghe nhiều nhất. Hãy thêm bài hát và để người dùng nghe để xem thống kê."
            />
          )}
        </div>
      </div>

      {/* Thống kê theo thể loại và nghệ sĩ */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(600px, 1fr))', 
        gap: 24,
        marginBottom: 50 
      }}>
        <div style={{
          background: 'linear-gradient(145deg, #23232b 0%, #1e1e24 100%)',
          borderRadius: 16,
          padding: 24,
          border: '1px solid #2e2e37',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
        }}>
          <h3 style={{ 
            color: '#e5e5e5', 
            marginBottom: 20,
            fontSize: 20,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            🎭 Thống kê theo thể loại
          </h3>
          {genreStats && genreStats.length > 0 ? (
            <div style={{ overflowX: 'auto', maxHeight: 400 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #2e2e37' }}>
                    <th style={{ 
                      color: '#b3b3b3', 
                      textAlign: 'left', 
                      padding: '12px 8px',
                      fontSize: 14,
                      fontWeight: 600,
                      width: '60%'
                    }}>Thể loại</th>
                    <th style={{ 
                      color: '#b3b3b3', 
                      textAlign: 'center', 
                      padding: '12px 8px',
                      fontSize: 14,
                      fontWeight: 600,
                      width: '20%'
                    }}>Số bài hát</th>
                    <th style={{ 
                      color: '#b3b3b3', 
                      textAlign: 'center', 
                      padding: '12px 8px',
                      fontSize: 14,
                      fontWeight: 600,
                      width: '20%'
                    }}>Tỷ lệ</th>
                  </tr>
                </thead>
                <tbody>
                  {genreStats.map((genre, index) => {
                    const totalSongs = genreStats.reduce((sum, g) => sum + g.songCount, 0);
                    const percentage = totalSongs > 0 ? Math.round((genre.songCount / totalSongs) * 100) : 0;
                    return (
                      <tr key={genre._id} style={{ 
                        borderBottom: '1px solid #2e2e37'
                      }}>
                        <td style={{ 
                          color: '#e5e5e5', 
                          padding: '12px 8px',
                          fontSize: 14,
                          maxWidth: '300px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          title: genre.genreName || genre._id
                        }}>
                          {genre.genreName || genre._id}
                        </td>
                        <td style={{ 
                          color: '#1db954', 
                          textAlign: 'center',
                          padding: '12px 8px',
                          fontSize: 14,
                          fontWeight: 600
                        }}>
                          {genre.songCount}
                        </td>
                        <td style={{ 
                          color: '#b3b3b3', 
                          textAlign: 'center',
                          padding: '12px 8px',
                          fontSize: 14
                        }}>
                          {percentage}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon="🎭"
              title="Chưa có thể loại nào"
              description="Hệ thống chưa có dữ liệu về thể loại. Hãy thêm bài hát với các thể loại khác nhau để xem thống kê."
            />
          )}
        </div>

        <div style={{
          background: 'linear-gradient(145deg, #23232b 0%, #1e1e24 100%)',
          borderRadius: 16,
          padding: 24,
          border: '1px solid #2e2e37',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
        }}>
          <h3 style={{ 
            color: '#e5e5e5', 
            marginBottom: 20,
            fontSize: 20,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            🎤 Thống kê theo nghệ sĩ
          </h3>
          {artistStats && artistStats.length > 0 ? (
            <div style={{ overflowX: 'auto', maxHeight: 400 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #2e2e37' }}>
                    <th style={{ 
                      color: '#b3b3b3', 
                      textAlign: 'left', 
                      padding: '12px 8px',
                      fontSize: 14,
                      fontWeight: 600,
                      width: '60%'
                    }}>Nghệ sĩ</th>
                    <th style={{ 
                      color: '#b3b3b3', 
                      textAlign: 'center', 
                      padding: '12px 8px',
                      fontSize: 14,
                      fontWeight: 600,
                      width: '20%'
                    }}>Số bài hát</th>
                    <th style={{ 
                      color: '#b3b3b3', 
                      textAlign: 'center', 
                      padding: '12px 8px',
                      fontSize: 14,
                      fontWeight: 600,
                      width: '20%'
                    }}>Tỷ lệ</th>
                  </tr>
                </thead>
                <tbody>
                  {artistStats.map((artist, index) => {
                    const totalSongs = artistStats.reduce((sum, a) => sum + a.songCount, 0);
                    const percentage = totalSongs > 0 ? Math.round((artist.songCount / totalSongs) * 100) : 0;
                    return (
                      <tr key={artist._id} style={{ 
                        borderBottom: '1px solid #2e2e37'
                      }}>
                        <td style={{ 
                          color: '#e5e5e5', 
                          padding: '12px 8px',
                          fontSize: 14,
                          maxWidth: '300px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          title: artist._id
                        }}>
                          {artist._id}
                        </td>
                        <td style={{ 
                          color: '#1db954', 
                          textAlign: 'center',
                          padding: '12px 8px',
                          fontSize: 14,
                          fontWeight: 600
                        }}>
                          {artist.songCount}
                        </td>
                        <td style={{ 
                          color: '#b3b3b3', 
                          textAlign: 'center',
                          padding: '12px 8px',
                          fontSize: 14
                        }}>
                          {percentage}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon="🎤"
              title="Chưa có nghệ sĩ nào"
              description="Hệ thống chưa có dữ liệu về nghệ sĩ. Hãy thêm bài hát với thông tin nghệ sĩ để xem thống kê."
            />
          )}
        </div>
      </div>

      {/* Thống kê người dùng hoạt động */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', 
        gap: 24 
      }}>
        <div style={{
          background: 'linear-gradient(145deg, #23232b 0%, #1e1e24 100%)',
          borderRadius: 16,
          padding: 24,
          border: '1px solid #2e2e37',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
        }}>
          <h3 style={{ 
            color: '#e5e5e5', 
            marginBottom: 20,
            fontSize: 20,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            👥 Người dùng nghe nhiều nhất
          </h3>
          {userActivity.topListeners && userActivity.topListeners.length > 0 ? (
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {userActivity.topListeners.map((user, index) => (
                <div key={user._id} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: index < userActivity.topListeners.length - 1 ? '1px solid #2e2e37' : 'none'
                }}>
                  <div>
                    <div style={{ color: '#e5e5e5', fontWeight: 'bold' }}>{user.username}</div>
                    <div style={{ color: '#b3b3b3', fontSize: 12 }}>{user.email}</div>
                  </div>
                  <div style={{ color: '#1db954', fontWeight: 'bold' }}>
                    {user.listenCount} lượt nghe
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="👥"
              title="Chưa có dữ liệu nghe"
              description="Hệ thống chưa có dữ liệu về hoạt động nghe của người dùng. Hãy để người dùng nghe nhạc để xem thống kê."
            />
          )}
        </div>

        <div style={{
          background: 'linear-gradient(145deg, #23232b 0%, #1e1e24 100%)',
          borderRadius: 16,
          padding: 24,
          border: '1px solid #2e2e37',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
        }}>
          <h3 style={{ 
            color: '#e5e5e5', 
            marginBottom: 20,
            fontSize: 20,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            📋 Người dùng tạo playlist nhiều nhất
          </h3>
          {userActivity.topPlaylistCreators && userActivity.topPlaylistCreators.length > 0 ? (
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {userActivity.topPlaylistCreators.map((user, index) => (
                <div key={user._id} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: index < userActivity.topPlaylistCreators.length - 1 ? '1px solid #2e2e37' : 'none'
                }}>
                  <div>
                    <div style={{ color: '#e5e5e5', fontWeight: 'bold' }}>{user.username}</div>
                    <div style={{ color: '#b3b3b3', fontSize: 12 }}>{user.email}</div>
                  </div>
                  <div style={{ color: '#1db954', fontWeight: 'bold' }}>
                    {user.playlistCount} playlist
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="📋"
              title="Chưa có playlist nào"
              description="Hệ thống chưa có dữ liệu về playlist của người dùng. Hãy để người dùng tạo playlist để xem thống kê."
            />
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

export default StatisticsAdmin;
