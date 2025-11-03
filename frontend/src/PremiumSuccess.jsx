import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import Header from './Header';
import { FaCrown, FaCheckCircle, FaSpinner } from 'react-icons/fa';

const PremiumSuccess = () => {
  const { user, refreshUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const verifyAndActivatePremium = async () => {
      try {
        // Get session_id from URL
        const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
        const sessionId = urlParams.get('session_id');
        
        if (!sessionId) {
          showError('Không tìm thấy thông tin thanh toán');
          setLoading(false);
          setTimeout(() => {
            window.location.hash = '#/profile';
          }, 2000);
          return;
        }

        const token = user?.token || (localStorage.getItem('cs_user') ? JSON.parse(localStorage.getItem('cs_user')).token : null);
        
        if (!token) {
          showError('Vui lòng đăng nhập để tiếp tục');
          setTimeout(() => {
            window.location.hash = '#/';
          }, 2000);
          return;
        }

        // Call API to verify session and activate premium
        const response = await fetch('http://localhost:5000/api/premium/verify-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            sessionId: sessionId
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Xác minh thanh toán thất bại');
        }

        // Update user data in localStorage
        const storedUser = JSON.parse(localStorage.getItem('cs_user'));
        const updatedUser = { ...storedUser, ...data.user, token };
        localStorage.setItem('cs_user', JSON.stringify(updatedUser));
        
        // Refresh user context
        if (refreshUser) {
          await refreshUser();
        }
        
        setSuccess(true);
        showSuccess('Chúc mừng! Bạn đã nâng cấp lên Premium thành công!');

      } catch (error) {
        console.error('Premium verification error:', error);
        showError(error.message);
        setSuccess(false);
      } finally {
        setLoading(false);
      }
    };

    verifyAndActivatePremium();
  }, []);

  return (
    <div className="music-app dark-theme">
      <Header />
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '2rem',
        marginTop: '8rem',
        marginBottom: '120px',
        textAlign: 'center'
      }}>
        {loading ? (
          <div>
            <FaSpinner style={{
              fontSize: '4rem',
              color: '#ffd700',
              animation: 'spin 1s linear infinite',
              marginBottom: '2rem'
            }} />
            <h2 style={{
              color: '#fff',
              fontSize: '2rem',
              fontWeight: '700',
              margin: '0 0 1rem 0'
            }}>
              Đang xử lý thanh toán...
            </h2>
            <p style={{
              color: '#b3b3b3',
              fontSize: '1.1rem',
              margin: 0
            }}>
              Vui lòng đợi trong giây lát
            </p>
          </div>
        ) : success ? (
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '24px',
            border: '2px solid rgba(255, 215, 0, 0.3)',
            padding: '3rem 2rem',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ffd700, #ffed4e)',
              marginBottom: '2rem',
              boxShadow: '0 8px 32px rgba(255, 215, 0, 0.4)',
              animation: 'scaleIn 0.5s ease-out'
            }}>
              <FaCrown style={{ fontSize: '3rem', color: '#000' }} />
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              marginBottom: '1.5rem'
            }}>
              <FaCheckCircle style={{ color: '#1db954', fontSize: '2rem' }} />
              <h2 style={{
                color: '#fff',
                fontSize: '2.5rem',
                fontWeight: '700',
                margin: 0
              }}>
                Thanh toán thành công!
              </h2>
            </div>

            <p style={{
              color: '#b3b3b3',
              fontSize: '1.2rem',
              margin: '0 0 2rem 0',
              lineHeight: 1.6
            }}>
              Chúc mừng bạn đã trở thành thành viên Premium của CoreSound!<br/>
              Bắt đầu trải nghiệm âm nhạc không giới hạn ngay bây giờ.
            </p>

            <div style={{
              background: 'rgba(255, 215, 0, 0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              padding: '1.5rem',
              marginTop: '2rem'
            }}>
              <h3 style={{
                color: '#ffd700',
                fontSize: '1.3rem',
                fontWeight: '700',
                margin: '0 0 1rem 0'
              }}>
                Bạn đã được kích hoạt:
              </h3>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                textAlign: 'left',
                display: 'inline-block'
              }}>
                {[
                  'Nghe nhạc không quảng cáo',
                  'Chất lượng âm thanh cao',
                  'Tải nhạc offline',
                  'Bỏ qua không giới hạn'
                ].map((feature, idx) => (
                  <li key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.5rem 0',
                    color: '#e0e0e0',
                    fontSize: '1rem'
                  }}>
                    <FaCheckCircle style={{ color: '#1db954', fontSize: '1rem' }} />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Button to go back to Profile */}
            <button
              onClick={() => window.location.hash = '#/profile'}
              style={{
                marginTop: '2rem',
                padding: '1rem 2.5rem',
                background: 'linear-gradient(135deg, #1db954, #1ed760)',
                border: 'none',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '1.1rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 16px rgba(29, 185, 84, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(29, 185, 84, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 16px rgba(29, 185, 84, 0.3)';
              }}
            >
              Về trang hồ sơ
            </button>
          </div>
        ) : (
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '24px',
            border: '2px solid rgba(255, 69, 0, 0.3)',
            padding: '3rem 2rem'
          }}>
            <h2 style={{
              color: '#ff4500',
              fontSize: '2rem',
              fontWeight: '700',
              margin: '0 0 1rem 0'
            }}>
              Có lỗi xảy ra
            </h2>
            <p style={{
              color: '#b3b3b3',
              fontSize: '1.1rem',
              margin: '0 0 2rem 0'
            }}>
              Không thể kích hoạt Premium. Vui lòng liên hệ hỗ trợ.
            </p>
            <button
              onClick={() => window.location.hash = '#/profile'}
              style={{
                padding: '1rem 2rem',
                background: '#1db954',
                border: 'none',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = '#1ed760'}
              onMouseLeave={(e) => e.target.style.background = '#1db954'}
            >
              Quay lại hồ sơ
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes scaleIn {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default PremiumSuccess;
