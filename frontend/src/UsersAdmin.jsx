import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import AdminSidebar from './AdminSidebar';

const UsersAdmin = () => {
  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user'
  });

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('cs_user');
      const userData = token ? JSON.parse(token) : null;
      
      if (!userData) {
        showError('Vui lòng đăng nhập lại');
        return;
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter && { role: roleFilter })
      });

      const response = await fetch(`http://localhost:5000/api/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${userData.token || 'dummy-token'}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Không thể tải danh sách người dùng');
      }

      const data = await response.json();
      setUsers(data.users);
      setTotalPages(data.pagination.total);
      setTotalCount(data.pagination.count);
    } catch (error) {
      console.error('Fetch users error:', error);
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, roleFilter]);

  // Create user
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('cs_user');
      const userData = token ? JSON.parse(token) : null;

      const response = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userData.token || 'dummy-token'}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Tạo người dùng thất bại');
      }

      showSuccess('Tạo người dùng thành công');
      setShowCreateModal(false);
      setFormData({ name: '', email: '', password: '', role: 'user' });
      fetchUsers();
    } catch (error) {
      showError(error.message);
    }
  };

  // Update user
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('cs_user');
      const userData = token ? JSON.parse(token) : null;

      const response = await fetch(`http://localhost:5000/api/users/${selectedUser._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${userData.token || 'dummy-token'}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          role: formData.role
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Cập nhật người dùng thất bại');
      }

      showSuccess('Cập nhật người dùng thành công');
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      showError(error.message);
    }
  };

  // Delete user
  const handleDeleteUser = async (userId) => {
    if (!confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      return;
    }

    try {
      const token = localStorage.getItem('cs_user');
      const userData = token ? JSON.parse(token) : null;

      const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${userData.token || 'dummy-token'}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Xóa người dùng thất bại');
      }

      showSuccess('Xóa người dùng thành công');
      fetchUsers();
    } catch (error) {
      showError(error.message);
    }
  };

  // Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('cs_user');
      const userData = token ? JSON.parse(token) : null;

      const response = await fetch(`http://localhost:5000/api/users/${selectedUser._id}/reset-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${userData.token || 'dummy-token'}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newPassword: formData.password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Đặt lại mật khẩu thất bại');
      }

      showSuccess('Đặt lại mật khẩu thành công');
      setShowResetPasswordModal(false);
      setSelectedUser(null);
      setFormData({ ...formData, password: '' });
    } catch (error) {
      showError(error.message);
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      password: ''
    });
    setShowEditModal(true);
  };

  const openResetPasswordModal = (user) => {
    setSelectedUser(user);
    setFormData({ ...formData, password: '' });
    setShowResetPasswordModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="music-app dark-theme">
      <AdminSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="admin-container">
        <div className="admin-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
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
              ☰
            </button>
            <h1>Quản lý người dùng</h1>
          </div>
          <button
            className="admin-btn primary"
            onClick={() => setShowCreateModal(true)}
          >
            + Thêm người dùng
          </button>
        </div>

        {/* Filters */}
        <div className="admin-filters">
          <div className="filter-group">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-input"
            />
          </div>
          <div className="filter-group">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="admin-select"
            >
              <option value="">Tất cả vai trò</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="admin-table-container">
          {loading ? (
            <div className="loading">Đang tải...</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Tên</th>
                  <th>Email</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <div className="user-info">
                        <div className="user-avatar">
                          {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <span>{user.name}</span>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge ${user.role}`}>
                        {user.role === 'admin' ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                        {user.isActive ? 'Hoạt động' : 'Không hoạt động'}
                      </span>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="action-btn edit-btn"
                          onClick={() => openEditModal(user)}
                          title="Chỉnh sửa người dùng"
                        >
                          <span className="btn-icon">✎</span>
                        </button>
                        <button
                          className="action-btn reset-btn"
                          onClick={() => openResetPasswordModal(user)}
                          title="Đặt lại mật khẩu"
                        >
                          <span className="btn-icon">⚙</span>
                        </button>
                        {user._id !== currentUser?._id && (
                          <button
                            className="action-btn delete-btn"
                            onClick={() => handleDeleteUser(user._id)}
                            title="Xóa người dùng"
                          >
                            <span className="btn-icon">✕</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="admin-pagination">
            <button
              className="admin-btn secondary"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Trước
            </button>
            <span className="pagination-info">
              Trang {currentPage} / {totalPages} ({totalCount} người dùng)
            </span>
            <button
              className="admin-btn secondary"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Sau
            </button>
          </div>
        )}

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>Tạo người dùng mới</h2>
                <button
                  className="modal-close"
                  onClick={() => setShowCreateModal(false)}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleCreateUser} className="modal-form">
                <div className="form-group">
                  <label>Họ và tên</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="admin-input"
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="admin-input"
                  />
                </div>
                <div className="form-group">
                  <label>Mật khẩu</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    className="admin-input"
                  />
                </div>
                <div className="form-group">
                  <label>Vai trò</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="admin-select"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="admin-btn secondary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Hủy
                  </button>
                  <button type="submit" className="admin-btn primary">
                    Tạo người dùng
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && selectedUser && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>Chỉnh sửa người dùng</h2>
                <button
                  className="modal-close"
                  onClick={() => setShowEditModal(false)}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleUpdateUser} className="modal-form">
                <div className="form-group">
                  <label>Họ và tên</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="admin-input"
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="admin-input"
                  />
                </div>
                <div className="form-group">
                  <label>Vai trò</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="admin-select"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="admin-btn secondary"
                    onClick={() => setShowEditModal(false)}
                  >
                    Hủy
                  </button>
                  <button type="submit" className="admin-btn primary">
                    Cập nhật
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Reset Password Modal */}
        {showResetPasswordModal && selectedUser && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>Đặt lại mật khẩu</h2>
                <button
                  className="modal-close"
                  onClick={() => setShowResetPasswordModal(false)}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleResetPassword} className="modal-form">
                <div className="form-group">
                  <label>Người dùng</label>
                  <input
                    type="text"
                    value={selectedUser.name}
                    disabled
                    className="admin-input"
                  />
                </div>
                <div className="form-group">
                  <label>Mật khẩu mới</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    className="admin-input"
                    placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                  />
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="admin-btn secondary"
                    onClick={() => setShowResetPasswordModal(false)}
                  >
                    Hủy
                  </button>
                  <button type="submit" className="admin-btn warning">
                    Đặt lại mật khẩu
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersAdmin;
