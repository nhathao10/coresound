import { useAuth } from './AuthContext';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#18181b',
        color: '#fff',
        fontSize: '1.2rem'
      }}>
        Đang kiểm tra quyền truy cập...
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#18181b',
        color: '#fff',
        padding: '2rem'
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#ff6b6b' }}>
          Truy cập bị từ chối
        </h1>
        <p style={{ fontSize: '1.1rem', marginBottom: '2rem', textAlign: 'center', color: '#b3b3b3' }}>
          Bạn cần đăng nhập để truy cập trang này
        </p>
        <button
          onClick={() => window.location.hash = '#/'}
          style={{
            background: '#1db954',
            color: '#fff',
            border: 'none',
            borderRadius: '25px',
            padding: '0.75rem 2rem',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#1ed760';
            e.target.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = '#1db954';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          Về trang chủ
        </button>
      </div>
    );
  }

  // Check if admin access is required
  if (requireAdmin && !isAdmin) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#18181b',
        color: '#fff',
        padding: '2rem'
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#ff6b6b' }}>
          Không có quyền truy cập
        </h1>
        <p style={{ fontSize: '1.1rem', marginBottom: '2rem', textAlign: 'center', color: '#b3b3b3' }}>
          Chỉ quản trị viên mới có thể truy cập trang này
        </p>
        <button
          onClick={() => window.location.hash = '#/'}
          style={{
            background: '#1db954',
            color: '#fff',
            border: 'none',
            borderRadius: '25px',
            padding: '0.75rem 2rem',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#1ed760';
            e.target.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = '#1db954';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          Về trang chủ
        </button>
      </div>
    );
  }

  // User is authenticated and has required permissions
  return children;
};

export default ProtectedRoute;
