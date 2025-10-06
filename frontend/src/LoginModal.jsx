import { useState } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const LoginModal = ({ isOpen, onClose, onSwitchToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { showSuccess, showError } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      showSuccess('Đăng nhập thành công');
      onClose();
      setEmail('');
      setPassword('');
    } else {
      setError(result.error);
      showError(result.error);
    }
    
    setIsLoading(false);
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setError('');
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
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      backdropFilter: 'blur(5px)'
    }}>
      <div style={{
        backgroundColor: '#1e1e24',
        borderRadius: '16px',
        padding: '2rem',
        width: '400px',
        maxWidth: '90vw',
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
            color: '#fff',
            fontSize: '1.5rem',
            fontWeight: '700',
            margin: 0
          }}>
            Đăng nhập
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#b3b3b3',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: '50%',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.color = '#fff';
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.color = '#b3b3b3';
              e.target.style.background = 'transparent';
            }}
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Email Input */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              color: '#fff',
              fontSize: '0.9rem',
              fontWeight: '500',
              marginBottom: '0.5rem'
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                fontSize: '1rem',
                boxSizing: 'border-box',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#1db954';
                e.target.style.background = 'rgba(255, 255, 255, 0.08)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
              placeholder="Nhập email của bạn"
            />
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              color: '#fff',
              fontSize: '0.9rem',
              fontWeight: '500',
              marginBottom: '0.5rem'
            }}>
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                fontSize: '1rem',
                boxSizing: 'border-box',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#1db954';
                e.target.style.background = 'rgba(255, 255, 255, 0.08)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
              placeholder="Nhập mật khẩu"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              background: 'rgba(255, 68, 68, 0.1)',
              border: '1px solid rgba(255, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '0.75rem',
              marginBottom: '1.5rem',
              color: '#ff6b6b',
              fontSize: '0.9rem'
            }}>
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: isLoading ? 'rgba(29, 185, 84, 0.5)' : '#1db954',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              marginBottom: '1rem'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.target.style.background = '#1ed760';
                e.target.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.target.style.background = '#1db954';
                e.target.style.transform = 'translateY(0)';
              }
            }}
          >
            {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        {/* Switch to Signup */}
        <div style={{
          textAlign: 'center',
          color: '#b3b3b3',
          fontSize: '0.9rem'
        }}>
          Chưa có tài khoản?{' '}
          <button
            onClick={onSwitchToSignup}
            style={{
              background: 'none',
              border: 'none',
              color: '#1db954',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500',
              textDecoration: 'underline'
            }}
          >
            Đăng ký ngay
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
