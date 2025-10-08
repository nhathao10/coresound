import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load user from localStorage on app start
  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedUser = localStorage.getItem('cs_user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          
          // Try to refresh user data from server to get latest followedArtists
          try {
            const response = await fetch('http://localhost:5000/api/auth/me', {
              headers: {
                'Authorization': `Bearer ${userData.token}`
              }
            });
            
            if (response.ok) {
              const serverData = await response.json();
              const updatedUser = { ...serverData.user, token: userData.token };
              localStorage.setItem('cs_user', JSON.stringify(updatedUser));
              setUser(updatedUser);
            } else {
              // If server request fails, use localStorage data
              setUser(userData);
            }
          } catch (error) {
            // If server request fails, use localStorage data
            console.error('Error refreshing user from server:', error);
            setUser(userData);
          }
          
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error loading user from localStorage:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUser();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Đăng nhập thất bại');
      }

      // Save user and token to localStorage
      const userWithToken = { ...data.user, token: data.token };
      localStorage.setItem('cs_user', JSON.stringify(userWithToken));
      setUser(userWithToken);
      setIsAuthenticated(true);
      
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (name, email, password, role = 'user') => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Đăng ký thất bại');
      }

      // Auto login after successful registration
      const userWithToken = { ...data.user, token: data.token };
      localStorage.setItem('cs_user', JSON.stringify(userWithToken));
      setUser(userWithToken);
      setIsAuthenticated(true);
      
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('cs_user');
    setUser(null);
    setIsAuthenticated(false);
    
    // Dispatch event to notify other components to clear their data
    window.dispatchEvent(new CustomEvent('userLoggedOut'));
    
    window.location.hash = '#/'; // Redirect to home after logout
  };

  // Check if user is admin
  const isAdmin = () => {
    return user && user.role === 'admin';
  };

  // Check if user can access admin routes
  const canAccessAdmin = () => {
    return isAuthenticated && isAdmin();
  };

  // Refresh user data from localStorage
  const refreshUser = () => {
    try {
      const savedUser = localStorage.getItem('cs_user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  // Update user's followed artists
  const updateUserFollowedArtists = (artistId, isFollowing) => {
    if (!user) return;
    
    const updatedUser = { ...user };
    if (isFollowing) {
      if (!updatedUser.followedArtists) {
        updatedUser.followedArtists = [];
      }
      if (!updatedUser.followedArtists.includes(artistId)) {
        updatedUser.followedArtists.push(artistId);
      }
    } else {
      updatedUser.followedArtists = updatedUser.followedArtists?.filter(id => id !== artistId) || [];
    }
    
    setUser(updatedUser);
    localStorage.setItem('cs_user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
    updateUserFollowedArtists,
    isAdmin: isAdmin(),
    canAccessAdmin: canAccessAdmin(),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
