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
  const [albumStats, setAlbumStats] = useState(null);
  const [growthMetrics, setGrowthMetrics] = useState(null);

  // Format số lượt phát cho dễ đọc
  const formatPlayCount = (num) => {
    if (num == null || num === 0) return "0";
    const abs = Math.abs(num);
    const compact = (value) => {
      const fixed = value.toFixed(1);
      return fixed.endsWith(".0") ? String(Math.round(value)) : fixed;
    };
    if (abs >= 1_000_000_000) return `${compact(num / 1_000_000_000)}B`;
    if (abs >= 1_000_000) return `${compact(num / 1_000_000)}M`;
    if (abs >= 1_000) return `${compact(num / 1_000)}K`;
    return String(num);
  };

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
      } else {
        console.error('Time-based stats API error:', response.status);
      }
    } catch (error) {
      console.error('Lỗi khi lấy thống kê theo thời gian:', error);
    }
  }, [user]);

  const fetchAlbumStats = useCallback(async () => {
    try {
      const token = user?.token || (localStorage.getItem('cs_user') ? JSON.parse(localStorage.getItem('cs_user')).token : null);
      const response = await fetch('http://localhost:5000/api/statistics/albums-stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAlbumStats(data);
      }
    } catch (error) {
      console.error('Lỗi khi lấy thống kê album:', error);
    }
  }, [user]);

  const fetchGrowthMetrics = useCallback(async () => {
    try {
      const token = user?.token || (localStorage.getItem('cs_user') ? JSON.parse(localStorage.getItem('cs_user')).token : null);
      const response = await fetch('http://localhost:5000/api/statistics/growth-metrics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setGrowthMetrics(data);
      }
    } catch (error) {
      console.error('Lỗi khi lấy growth metrics:', error);
    }
  }, [user]);


  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchOverviewStats();
      fetchGenreStats();
      fetchArtistStats();
      fetchUserActivity();
      fetchTimeBasedStats(selectedPeriod);
      fetchAlbumStats();
      fetchGrowthMetrics();
    }
  }, [user, selectedPeriod, fetchOverviewStats, fetchGenreStats, fetchArtistStats, fetchUserActivity, fetchTimeBasedStats, fetchAlbumStats, fetchGrowthMetrics]);

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

      {/* Growth Metrics */}
      {growthMetrics && (
        <div style={{ marginBottom: 50 }}>
          <h2 style={{ 
            color: '#e5e5e5', 
            marginBottom: 24,
            fontSize: 28,
            fontWeight: 700,
            position: 'relative',
            paddingBottom: 12
          }}>
            📈 Tăng trưởng tuần này
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
            {/* Người dùng mới */}
            <div style={{
              background: 'linear-gradient(145deg, #23232b 0%, #1e1e24 100%)',
              borderRadius: 16,
              padding: 24,
              border: '1px solid #2e2e37',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ color: '#b3b3b3', fontSize: 14, marginBottom: 8 }}>Người dùng mới</div>
                  <div style={{ color: '#fff', fontSize: 32, fontWeight: 'bold' }}>
                    {growthMetrics.users.thisWeek}
                  </div>
                </div>
                <div style={{
                  background: growthMetrics.users.growth >= 0 ? 'rgba(29, 185, 84, 0.2)' : 'rgba(255, 107, 107, 0.2)',
                  color: growthMetrics.users.growth >= 0 ? '#1db954' : '#ff6b6b',
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600
                }}>
                  {growthMetrics.users.growth >= 0 ? '↑' : '↓'} {Math.abs(growthMetrics.users.growth)}%
                </div>
              </div>
              <div style={{ color: '#b3b3b3', fontSize: 12 }}>
                Tuần trước: {growthMetrics.users.lastWeek}
              </div>
            </div>

            {/* Bài hát mới */}
            <div style={{
              background: 'linear-gradient(145deg, #23232b 0%, #1e1e24 100%)',
              borderRadius: 16,
              padding: 24,
              border: '1px solid #2e2e37',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ color: '#b3b3b3', fontSize: 14, marginBottom: 8 }}>Bài hát mới</div>
                  <div style={{ color: '#fff', fontSize: 32, fontWeight: 'bold' }}>
                    {growthMetrics.songs.thisWeek}
                  </div>
                </div>
                <div style={{
                  background: growthMetrics.songs.growth >= 0 ? 'rgba(29, 185, 84, 0.2)' : 'rgba(255, 107, 107, 0.2)',
                  color: growthMetrics.songs.growth >= 0 ? '#1db954' : '#ff6b6b',
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600
                }}>
                  {growthMetrics.songs.growth >= 0 ? '↑' : '↓'} {Math.abs(growthMetrics.songs.growth)}%
                </div>
              </div>
              <div style={{ color: '#b3b3b3', fontSize: 12 }}>
                Tuần trước: {growthMetrics.songs.lastWeek}
              </div>
            </div>

            {/* Lượt nghe */}
            <div style={{
              background: 'linear-gradient(145deg, #23232b 0%, #1e1e24 100%)',
              borderRadius: 16,
              padding: 24,
              border: '1px solid #2e2e37',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ color: '#b3b3b3', fontSize: 14, marginBottom: 8 }}>Lượt nghe</div>
                  <div style={{ color: '#fff', fontSize: 32, fontWeight: 'bold' }}>
                    {growthMetrics.plays.thisWeek}
                  </div>
                </div>
                <div style={{
                  background: growthMetrics.plays.growth >= 0 ? 'rgba(29, 185, 84, 0.2)' : 'rgba(255, 107, 107, 0.2)',
                  color: growthMetrics.plays.growth >= 0 ? '#1db954' : '#ff6b6b',
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600
                }}>
                  {growthMetrics.plays.growth >= 0 ? '↑' : '↓'} {Math.abs(growthMetrics.plays.growth)}%
                </div>
              </div>
              <div style={{ color: '#b3b3b3', fontSize: 12 }}>
                Tuần trước: {growthMetrics.plays.lastWeek}
              </div>
            </div>

            {/* Bình luận */}
            <div style={{
              background: 'linear-gradient(145deg, #23232b 0%, #1e1e24 100%)',
              borderRadius: 16,
              padding: 24,
              border: '1px solid #2e2e37',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ color: '#b3b3b3', fontSize: 14, marginBottom: 8 }}>Bình luận</div>
                  <div style={{ color: '#fff', fontSize: 32, fontWeight: 'bold' }}>
                    {growthMetrics.comments.thisWeek}
                  </div>
                </div>
                <div style={{
                  background: growthMetrics.comments.growth >= 0 ? 'rgba(29, 185, 84, 0.2)' : 'rgba(255, 107, 107, 0.2)',
                  color: growthMetrics.comments.growth >= 0 ? '#1db954' : '#ff6b6b',
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600
                }}>
                  {growthMetrics.comments.growth >= 0 ? '↑' : '↓'} {Math.abs(growthMetrics.comments.growth)}%
                </div>
              </div>
              <div style={{ color: '#b3b3b3', fontSize: 12 }}>
                Tuần trước: {growthMetrics.comments.lastWeek}
              </div>
            </div>
          </div>
        </div>
      )}

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
                  <div key={genre._id || index} style={{
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
                  <div key={artist._id || index} style={{
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
              marginBottom: 8,
              fontSize: 18,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              💡 Insights quan trọng
            </h3>
            <p style={{ 
              color: '#b3b3b3', 
              fontSize: 14, 
              marginBottom: 20,
              lineHeight: 1.4
            }}>
              Các chỉ số quan trọng giúp hiểu rõ hiệu suất và xu hướng của hệ thống
            </p>
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
                    <div style={{ color: '#e5e5e5', fontSize: 14, fontWeight: 500 }}>📀 Trung bình bài hát/album</div>
                    <div style={{ color: '#b3b3b3', fontSize: 12 }}>Số bài hát trung bình trong mỗi album</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: '#1db954', fontWeight: 600, fontSize: 16 }}>
                      {overview.totalAlbums > 0 ? Math.round(overview.totalSongs / overview.totalAlbums) : 0}
                    </span>
                    <div style={{ color: '#b3b3b3', fontSize: 11 }}>bài/album</div>
                  </div>
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
                    <div style={{ color: '#e5e5e5', fontSize: 14, fontWeight: 500 }}>📋 Trung bình playlist/người dùng</div>
                    <div style={{ color: '#b3b3b3', fontSize: 12 }}>Số playlist trung bình mỗi người dùng tạo</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: '#1db954', fontWeight: 600, fontSize: 16 }}>
                      {overview.totalUsers > 0 ? Math.round(overview.totalPlaylists / overview.totalUsers) : 0}
                    </span>
                    <div style={{ color: '#b3b3b3', fontSize: 11 }}>playlist/user</div>
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0'
                }}>
                  <div>
                    <div style={{ color: '#e5e5e5', fontSize: 14, fontWeight: 500 }}>❤️ Trung bình yêu thích/người dùng</div>
                    <div style={{ color: '#b3b3b3', fontSize: 12 }}>Số bài hát yêu thích trung bình mỗi người dùng</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: '#1db954', fontWeight: 600, fontSize: 16 }}>
                      {overview.totalUsers > 0 ? Math.round(overview.totalFavorites / overview.totalUsers) : 0}
                    </span>
                    <div style={{ color: '#b3b3b3', fontSize: 11 }}>favorites/user</div>
                  </div>
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
                        <tr key={JSON.stringify(stat._id) || index} style={{ 
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
                📚 Thống kê nội dung
              </h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                gap: 16 
              }}>
                <div style={{ 
                  textAlign: 'center',
                  background: '#23232b',
                  borderRadius: 12,
                  padding: 20,
                  border: '1px solid #2e2e37'
                }}>
                  <div style={{ color: '#1db954', fontSize: 32, fontWeight: 'bold', marginBottom: 8 }}>
                    {overview?.totalSongs || 0}
                  </div>
                  <div style={{ color: '#b3b3b3', fontSize: 14, fontWeight: 500 }}>
                    Tổng bài hát
                  </div>
                </div>
                <div style={{ 
                  textAlign: 'center',
                  background: '#23232b',
                  borderRadius: 12,
                  padding: 20,
                  border: '1px solid #2e2e37'
                }}>
                  <div style={{ color: '#1db954', fontSize: 32, fontWeight: 'bold', marginBottom: 8 }}>
                    {overview?.totalAlbums || 0}
                  </div>
                  <div style={{ color: '#b3b3b3', fontSize: 14, fontWeight: 500 }}>
                    Tổng album
                  </div>
                </div>
                <div style={{ 
                  textAlign: 'center',
                  background: '#23232b',
                  borderRadius: 12,
                  padding: 20,
                  border: '1px solid #2e2e37'
                }}>
                  <div style={{ color: '#1db954', fontSize: 32, fontWeight: 'bold', marginBottom: 8 }}>
                    {overview?.totalArtists || 0}
                  </div>
                  <div style={{ color: '#b3b3b3', fontSize: 14, fontWeight: 500 }}>
                    Tổng nghệ sĩ
                  </div>
                </div>
                <div style={{ 
                  textAlign: 'center',
                  background: '#23232b',
                  borderRadius: 12,
                  padding: 20,
                  border: '1px solid #2e2e37'
                }}>
                  <div style={{ color: '#1db954', fontSize: 32, fontWeight: 'bold', marginBottom: 8 }}>
                    {overview?.totalPlaylists || 0}
                  </div>
                  <div style={{ color: '#b3b3b3', fontSize: 14, fontWeight: 500 }}>
                    Tổng playlist
                  </div>
                </div>
              </div>
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

      {/* Thống kê theo thời gian */}
      <div style={{ marginBottom: 50 }}>
        <h2 style={{ 
          color: '#e5e5e5', 
          marginBottom: 24,
          fontSize: 28,
          fontWeight: 700,
          position: 'relative',
          paddingBottom: 12
        }}>
          📅 Thống kê đăng ký
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
          {timeBasedStats && timeBasedStats.userRegistrations && timeBasedStats.userRegistrations.length > 0 ? (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: 20 
            }}>
              <div style={{ 
                textAlign: 'center',
                background: '#1a1a1d',
                borderRadius: 12,
                padding: 24,
                border: '1px solid #2e2e37'
              }}>
                <div style={{ color: '#1db954', fontSize: 36, fontWeight: 'bold', marginBottom: 12 }}>
                  {timeBasedStats.userRegistrations.reduce((sum, reg) => sum + reg.count, 0)}
                </div>
                <div style={{ color: '#b3b3b3', fontSize: 16, fontWeight: 500 }}>
                  Đăng ký trong {selectedPeriod === '7d' ? '7 ngày' : selectedPeriod === '30d' ? '30 ngày' : selectedPeriod === '90d' ? '90 ngày' : '1 năm'}
                </div>
              </div>
              <div style={{ 
                textAlign: 'center',
                background: '#1a1a1d',
                borderRadius: 12,
                padding: 24,
                border: '1px solid #2e2e37'
              }}>
                <div style={{ color: '#1db954', fontSize: 36, fontWeight: 'bold', marginBottom: 12 }}>
                  {timeBasedStats.userRegistrations.length}
                </div>
                <div style={{ color: '#b3b3b3', fontSize: 16, fontWeight: 500 }}>
                  Ngày có đăng ký
                </div>
              </div>
              <div style={{ 
                textAlign: 'center',
                background: '#1a1a1d',
                borderRadius: 12,
                padding: 24,
                border: '1px solid #2e2e37'
              }}>
                <div style={{ color: '#1db954', fontSize: 36, fontWeight: 'bold', marginBottom: 12 }}>
                  {timeBasedStats.userRegistrations.length > 0 ? Math.round(timeBasedStats.userRegistrations.reduce((sum, reg) => sum + reg.count, 0) / timeBasedStats.userRegistrations.length * 10) / 10 : 0}
                </div>
                <div style={{ color: '#b3b3b3', fontSize: 16, fontWeight: 500 }}>
                  Trung bình/ngày
                </div>
              </div>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: 20 
            }}>
              <div style={{ 
                textAlign: 'center',
                background: '#1a1a1d',
                borderRadius: 12,
                padding: 24,
                border: '1px solid #2e2e37'
              }}>
                <div style={{ color: '#1db954', fontSize: 36, fontWeight: 'bold', marginBottom: 12 }}>
                  {overview?.totalUsers || 0}
                </div>
                <div style={{ color: '#b3b3b3', fontSize: 16, fontWeight: 500 }}>
                  Tổng người dùng
                </div>
              </div>
              <div style={{ 
                textAlign: 'center',
                background: '#1a1a1d',
                borderRadius: 12,
                padding: 24,
                border: '1px solid #2e2e37'
              }}>
                <div style={{ color: '#1db954', fontSize: 36, fontWeight: 'bold', marginBottom: 12 }}>
                  {overview?.totalComments || 0}
                </div>
                <div style={{ color: '#b3b3b3', fontSize: 16, fontWeight: 500 }}>
                  Tổng bình luận
                </div>
              </div>
              <div style={{ 
                textAlign: 'center',
                background: '#1a1a1d',
                borderRadius: 12,
                padding: 24,
                border: '1px solid #2e2e37'
              }}>
                <div style={{ color: '#1db954', fontSize: 36, fontWeight: 'bold', marginBottom: 12 }}>
                  {overview?.totalFavorites || 0}
                </div>
                <div style={{ color: '#b3b3b3', fontSize: 16, fontWeight: 500 }}>
                  Tổng yêu thích
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bài hát được phát nhiều nhất */}
      <div style={{ marginBottom: 50 }}>
        <h2 style={{ 
          color: '#e5e5e5', 
          marginBottom: 24,
          fontSize: 28,
          fontWeight: 700,
          position: 'relative',
          paddingBottom: 12
        }}>
          🎵 Bài hát được phát nhiều nhất
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
              {topSongs.slice(0, 5).map((song, index) => (
                <div key={song._id || index} style={{ 
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
                  <div 
                    style={{ 
                      color: '#1db954', 
                      fontWeight: 'bold',
                      cursor: 'help'
                    }}
                    title={`${song.playCount.toLocaleString('vi-VN')} lượt phát`}
                  >
                    {formatPlayCount(song.playCount)} lượt phát
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="🎵"
              title="Chưa có dữ liệu phát nhạc"
              description="Hệ thống chưa có dữ liệu về bài hát được phát nhiều nhất. Hãy để người dùng phát nhạc để xem thống kê."
            />
          )}
        </div>
      </div>

      {/* Thống kê Album */}
      {albumStats && (albumStats.topAlbums?.length > 0 || albumStats.topCommentedAlbums?.length > 0 || albumStats.topRatedAlbums?.length > 0) && (
        <div style={{ marginBottom: 50 }}>
          <h2 style={{ 
            color: '#e5e5e5', 
            marginBottom: 24,
            fontSize: 28,
            fontWeight: 700,
            position: 'relative',
            paddingBottom: 12
          }}>
            💿 Thống kê Album
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
            gap: 24 
          }}>
            {/* Top Albums theo lượt phát */}
            {albumStats.topAlbums && albumStats.topAlbums.length > 0 && (
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
                  🔥 Top Albums (Lượt phát)
                </h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  {albumStats.topAlbums.slice(0, 5).map((album, index) => (
                    <div key={album._id || index} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      padding: '12px',
                      background: '#1a1a1d',
                      borderRadius: 8,
                      border: '1px solid #2e2e37',
                      gap: 12
                    }}>
                      <span style={{ 
                        color: '#1db954', 
                        fontWeight: 'bold', 
                        minWidth: 24
                      }}>
                        #{index + 1}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#e5e5e5', fontWeight: 'bold', fontSize: 14 }}>{album.name}</div>
                        <div style={{ color: '#b3b3b3', fontSize: 12 }}>{album.artist} • {album.songCount} bài</div>
                      </div>
                      <div style={{ 
                        color: '#1db954', 
                        fontWeight: 'bold',
                        fontSize: 14
                      }}>
                        {formatPlayCount(album.totalPlays)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Albums có nhiều bình luận */}
            {albumStats.topCommentedAlbums && albumStats.topCommentedAlbums.length > 0 && (
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
                  💬 Albums nhiều bình luận nhất
                </h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  {albumStats.topCommentedAlbums.map((album, index) => (
                    <div key={album._id || index} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center', 
                      padding: '12px',
                      background: '#1a1a1d',
                      borderRadius: 8,
                      border: '1px solid #2e2e37'
                    }}>
                      <div>
                        <div style={{ color: '#e5e5e5', fontWeight: 'bold', fontSize: 14 }}>{album.name}</div>
                        <div style={{ color: '#b3b3b3', fontSize: 12 }}>{album.artist}</div>
                      </div>
                      <div style={{ 
                        color: '#1db954', 
                        fontWeight: 'bold',
                        fontSize: 14
                      }}>
                        {album.commentCount} 💬
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Albums có rating cao */}
            {albumStats.topRatedAlbums && albumStats.topRatedAlbums.length > 0 && (
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
                  ⭐ Albums đánh giá cao nhất
                </h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  {albumStats.topRatedAlbums.map((album, index) => (
                    <div key={album._id || index} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center', 
                      padding: '12px',
                      background: '#1a1a1d',
                      borderRadius: 8,
                      border: '1px solid #2e2e37'
                    }}>
                      <div>
                        <div style={{ color: '#e5e5e5', fontWeight: 'bold', fontSize: 14 }}>{album.name}</div>
                        <div style={{ color: '#b3b3b3', fontSize: 12 }}>{album.artist} • {album.ratingCount} đánh giá</div>
                      </div>
                      <div style={{ 
                        color: '#ffd700', 
                        fontWeight: 'bold',
                        fontSize: 16
                      }}>
                        ⭐ {album.avgRating}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
            marginBottom: 8,
            fontSize: 20,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            🎭 Thống kê theo thể loại
          </h3>
          <p style={{ 
            color: '#b3b3b3', 
            fontSize: 12, 
            marginBottom: 20,
            lineHeight: 1.4
          }}>
            Tỷ lệ % = (Số bài hát của thể loại / Tổng số bài hát) × 100
          </p>
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
                    }}>Tỷ lệ (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {genreStats.map((genre, index) => {
                    const totalSongs = genreStats.reduce((sum, g) => sum + g.songCount, 0);
                    const percentage = totalSongs > 0 ? Math.round((genre.songCount / totalSongs) * 100) : 0;
                    return (
                      <tr key={genre._id || index} style={{ 
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
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            gap: 8
                          }}>
                            <span>{percentage}%</span>
                            <div style={{
                              width: 40,
                              height: 4,
                              background: '#2e2e37',
                              borderRadius: 2,
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${percentage}%`,
                                height: '100%',
                                background: percentage > 50 ? '#1db954' : percentage > 25 ? '#ffa500' : '#ff6b6b',
                                borderRadius: 2
                              }} />
                            </div>
                          </div>
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
            marginBottom: 8,
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
                      width: '70%'
                    }}>Nghệ sĩ</th>
                    <th style={{ 
                      color: '#b3b3b3', 
                      textAlign: 'center', 
                      padding: '12px 8px',
                      fontSize: 14,
                      fontWeight: 600,
                      width: '30%'
                    }}>Số bài hát</th>
                  </tr>
                </thead>
                <tbody>
                  {artistStats.map((artist, index) => {
                    return (
                      <tr key={artist._id || index} style={{ 
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
            👥 Người dùng nghe nhiều nhất
          </h3>
          {userActivity.topListeners && userActivity.topListeners.length > 0 ? (
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {userActivity.topListeners.map((user, index) => (
                <div key={user._id || index} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: index < userActivity.topListeners.length - 1 ? '1px solid #2e2e37' : 'none'
                }}>
                  <div>
                    <div style={{ color: '#e5e5e5', fontWeight: 'bold', fontSize: 16 }}>
                      {user.name || user.username || 'Người dùng không tên'}
                    </div>
                    <div style={{ color: '#b3b3b3', fontSize: 12 }}>
                      {user.email || `ID: ${user._id}`}
                    </div>
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
            📋 Người tạo playlist nhiều nhất
          </h3>
          {userActivity.topPlaylistCreators && userActivity.topPlaylistCreators.length > 0 ? (
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {userActivity.topPlaylistCreators.map((user, index) => (
                <div key={user._id || index} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: index < userActivity.topPlaylistCreators.length - 1 ? '1px solid #2e2e37' : 'none'
                }}>
                  <div>
                    <div style={{ color: '#e5e5e5', fontWeight: 'bold', fontSize: 16 }}>
                      {user.name || user.username || 'Người dùng không tên'}
                    </div>
                    <div style={{ color: '#b3b3b3', fontSize: 12 }}>
                      {user.email || `ID: ${user._id}`}
                    </div>
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
              title="Chưa có dữ liệu playlist"
              description="Hệ thống chưa có dữ liệu về người tạo playlist. Hãy để người dùng tạo playlist để xem thống kê."
            />
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

export default StatisticsAdmin;
