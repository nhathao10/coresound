import { useState } from 'react';
import { FaTimes, FaCrown, FaCheck, FaSpinner } from 'react-icons/fa';

const PremiumModal = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSelectPlan = async (plan) => {
    try {
      setLoading(true);
      setError('');

      // Get user token
      const userData = localStorage.getItem('cs_user');
      if (!userData) {
        setError('Vui lòng đăng nhập để tiếp tục');
        setLoading(false);
        return;
      }

      const { token } = JSON.parse(userData);

      // Call API to create checkout session
      const response = await fetch('http://localhost:5000/api/premium/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plan })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Không thể tạo phiên thanh toán');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;

    } catch (err) {
      console.error('Create checkout session error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #1a1a1f 0%, #2a2a35 100%)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 215, 0, 0.3)',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.5rem',
            right: '1.5rem',
            background: 'none',
            border: 'none',
            color: '#b3b3b3',
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: '50%',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 0, 0, 0.1)';
            e.target.style.color = '#ff4444';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'none';
            e.target.style.color = '#b3b3b3';
          }}
        >
          <FaTimes size="1rem" />
        </button>

        {/* Header */}
        <div style={{
          padding: '3rem 2rem 2rem',
          textAlign: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #ffd700, #ffed4e)',
            marginBottom: '1.5rem',
            boxShadow: '0 8px 24px rgba(255, 215, 0, 0.4)'
          }}>
            <FaCrown style={{ fontSize: '2.5rem', color: '#000' }} />
          </div>
          <h2 style={{
            color: '#fff',
            fontSize: '2.5rem',
            fontWeight: '700',
            margin: '0 0 1rem 0',
            background: 'linear-gradient(135deg, #ffd700, #ffed4e)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Nâng cấp lên Premium
          </h2>
          <p style={{
            color: '#b3b3b3',
            fontSize: '1.1rem',
            margin: 0,
            lineHeight: 1.6
          }}>
            Trải nghiệm âm nhạc không giới hạn với CoreSound Premium
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            margin: '1.5rem 2rem',
            padding: '1rem',
            background: 'rgba(255, 69, 0, 0.1)',
            border: '1px solid rgba(255, 69, 0, 0.3)',
            borderRadius: '12px',
            color: '#ff6b6b',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* Plans */}
        <div style={{
          padding: '2rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem'
        }}>
          {/* Monthly Plan */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '16px',
            border: '2px solid rgba(255, 255, 255, 0.1)',
            padding: '2rem',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.5)';
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(255, 215, 0, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}>
            <h3 style={{
              color: '#fff',
              fontSize: '1.5rem',
              fontWeight: '700',
              margin: '0 0 0.5rem 0'
            }}>
              Premium 1 Tháng
            </h3>
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '0.5rem',
              marginBottom: '1.5rem'
            }}>
              <span style={{
                color: '#ffd700',
                fontSize: '2.5rem',
                fontWeight: '700'
              }}>
                30.000đ
              </span>
            </div>

            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: '0 0 2rem 0'
            }}>
              {[
                'Nghe nhạc không quảng cáo',
                'Chất lượng âm thanh cao',
                'Tải nhạc offline',
                'Chơi minigame không giới hạn'
              ].map((feature, idx) => (
                <li key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 0',
                  color: '#b3b3b3',
                  fontSize: '0.95rem'
                }}>
                  <FaCheck style={{ color: '#1db954', fontSize: '1rem', flexShrink: 0 }} />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSelectPlan('monthly')}
              disabled={loading}
              style={{
                width: '100%',
                padding: '1rem',
                background: loading ? '#666' : 'linear-gradient(135deg, #ffd700, #ffed4e)',
                border: 'none',
                borderRadius: '12px',
                color: '#000',
                fontSize: '1.1rem',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 16px rgba(255, 215, 0, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                opacity: loading ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 16px rgba(255, 215, 0, 0.3)';
                }
              }}
            >
              {loading ? (
                <>
                  <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
                  Đang xử lý...
                </>
              ) : (
                'Chọn gói này'
              )}
            </button>
          </div>

          {/* Yearly Plan */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 215, 0, 0.05))',
            borderRadius: '16px',
            border: '2px solid rgba(255, 215, 0, 0.5)',
            padding: '2rem',
            position: 'relative',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.8)';
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(255, 215, 0, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.5)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}>
            {/* Best Value Badge */}
            <div style={{
              position: 'absolute',
              top: '-12px',
              right: '20px',
              background: 'linear-gradient(135deg, #ffd700, #ffed4e)',
              color: '#000',
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: '700',
              boxShadow: '0 4px 12px rgba(255, 215, 0, 0.4)'
            }}>
              Tiết kiệm nhất
            </div>

            <h3 style={{
              color: '#fff',
              fontSize: '1.5rem',
              fontWeight: '700',
              margin: '0 0 0.5rem 0'
            }}>
              Premium 1 Năm
            </h3>
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '0.5rem',
              marginBottom: '1.5rem'
            }}>
              <span style={{
                color: '#ffd700',
                fontSize: '2.5rem',
                fontWeight: '700'
              }}>
                300.000đ
              </span>
            </div>

            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: '0 0 2rem 0'
            }}>
              {[
                'Tất cả tính năng gói 1 tháng',
                'Tiết kiệm 2 tháng',
                'Ưu tiên hỗ trợ khách hàng',
                'Truy cập sớm tính năng mới'
              ].map((feature, idx) => (
                <li key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 0',
                  color: '#e0e0e0',
                  fontSize: '0.95rem'
                }}>
                  <FaCheck style={{ color: '#ffd700', fontSize: '1rem', flexShrink: 0 }} />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSelectPlan('yearly')}
              disabled={loading}
              style={{
                width: '100%',
                padding: '1rem',
                background: loading ? '#666' : 'linear-gradient(135deg, #ffd700, #ffed4e)',
                border: 'none',
                borderRadius: '12px',
                color: '#000',
                fontSize: '1.1rem',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 16px rgba(255, 215, 0, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                opacity: loading ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 16px rgba(255, 215, 0, 0.4)';
                }
              }}
            >
              {loading ? (
                <>
                  <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
                  Đang xử lý...
                </>
              ) : (
                'Chọn gói này'
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '1.5rem 2rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center'
        }}>
          <p style={{
            color: '#888',
            fontSize: '0.85rem',
            margin: 0,
            lineHeight: 1.6
          }}>
            Thanh toán an toàn qua Stripe. Bạn có thể hủy bất cứ lúc nào.<br/>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PremiumModal;
