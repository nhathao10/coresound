import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import AdminSidebar from './AdminSidebar';
import { FaPlus, FaEdit, FaTrash, FaPlay, FaPause, FaEye, FaEyeSlash, FaUpload, FaDownload } from 'react-icons/fa';

const PodcastsAdmin = () => {
  const { user } = useAuth();
  const [podcasts, setPodcasts] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEpisodeForm, setShowEpisodeForm] = useState(false);
  const [selectedPodcast, setSelectedPodcast] = useState(null);
  const [editingPodcast, setEditingPodcast] = useState(null);
  const [editingEpisode, setEditingEpisode] = useState(null);
  const [activeTab, setActiveTab] = useState('podcasts'); // 'podcasts' or 'episodes'

  // Form states
  const [podcastForm, setPodcastForm] = useState({
    title: '',
    description: '',
    host: '',
    hosts: '',
    category: 'Other',
    // language: 'vi',
    tags: '',
    website: '',
    isFeatured: false,
    type: 'series' // 'single' or 'series'
  });

  const [episodeForm, setEpisodeForm] = useState({
    title: '',
    description: '',
    duration: '',
    showNotes: '',
    guests: '',
    tags: '',
    isExplicit: false,
    season: 1,
    episodeType: 'full'
  });

  const [coverFile, setCoverFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);

  const categories = [
    'Technology', 'News', 'Entertainment', 'Education', 
    'Business', 'Health', 'Sports', 'Comedy', 'True Crime', 'Other'
  ];

  const episodeTypes = [
    { value: 'full', label: 'Full Episode' },
    { value: 'trailer', label: 'Trailer' },
    { value: 'bonus', label: 'Bonus Content' }
  ];

  // Fetch podcasts
  const fetchPodcasts = async () => {
    try {
      const token = user?.token || (localStorage.getItem('cs_user') ? JSON.parse(localStorage.getItem('cs_user')).token : null);
      const response = await fetch('http://localhost:5000/api/podcasts', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPodcasts(data.podcasts || data || []);
      } else {
        console.error('Failed to fetch podcasts');
      }
    } catch (error) {
      console.error('Error fetching podcasts:', error);
    }
  };

  // Fetch episodes for selected podcast
  const fetchEpisodes = async (podcastId) => {
    try {
      const token = user?.token || (localStorage.getItem('cs_user') ? JSON.parse(localStorage.getItem('cs_user')).token : null);
      const response = await fetch(`http://localhost:5000/api/podcasts/${podcastId}/episodes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setEpisodes(data.episodes || []);
      } else {
        console.error('Failed to fetch episodes');
      }
    } catch (error) {
      console.error('Error fetching episodes:', error);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchPodcasts();
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (selectedPodcast) {
      fetchEpisodes(selectedPodcast._id);
    }
  }, [selectedPodcast]);

  // Create podcast
  const handleCreatePodcast = async (e) => {
    e.preventDefault();
    try {
      const token = user?.token || (localStorage.getItem('cs_user') ? JSON.parse(localStorage.getItem('cs_user')).token : null);
      console.log('Token:', token);
      console.log('User:', user);
      console.log('Podcast form:', podcastForm);
      
      const formData = new FormData();
      
      Object.keys(podcastForm).forEach(key => {
        formData.append(key, podcastForm[key]);
      });
      
      if (coverFile) {
        formData.append('cover', coverFile);
      }
      
      if (audioFile) {
        formData.append('audio', audioFile);
      }

      const response = await fetch('http://localhost:5000/api/podcasts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (response.ok) {
        const result = await response.json();
        console.log('Success:', result);
        await fetchPodcasts();
        setShowCreateForm(false);
        resetPodcastForm();
      } else {
        const error = await response.json();
        console.error('Error response:', error);
        alert('Lỗi: ' + (error.message || 'Không thể tạo podcast'));
      }
    } catch (error) {
      console.error('Error creating podcast:', error);
      alert('Lỗi khi tạo podcast');
    }
  };

  // Update podcast
  const handleUpdatePodcast = async (e) => {
    e.preventDefault();
    try {
      const token = user?.token || (localStorage.getItem('cs_user') ? JSON.parse(localStorage.getItem('cs_user')).token : null);
      const formData = new FormData();
      
      Object.keys(podcastForm).forEach(key => {
        formData.append(key, podcastForm[key]);
      });
      
      if (coverFile) {
        formData.append('cover', coverFile);
      }
      
      if (audioFile) {
        formData.append('audio', audioFile);
      }

      const response = await fetch(`http://localhost:5000/api/podcasts/${editingPodcast._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        await fetchPodcasts();
        setEditingPodcast(null);
        setShowCreateForm(false);
        resetPodcastForm();
      } else {
        const error = await response.json();
        alert('Lỗi: ' + (error.message || 'Không thể cập nhật podcast'));
      }
    } catch (error) {
      console.error('Error updating podcast:', error);
      alert('Lỗi khi cập nhật podcast');
    }
  };

  // Create episode
  const handleCreateEpisode = async (e) => {
    e.preventDefault();
    try {
      const token = user?.token || (localStorage.getItem('cs_user') ? JSON.parse(localStorage.getItem('cs_user')).token : null);
      const formData = new FormData();
      
      Object.keys(episodeForm).forEach(key => {
        formData.append(key, episodeForm[key]);
      });
      
      if (audioFile) {
        formData.append('audio', audioFile);
      }

      const response = await fetch(`http://localhost:5000/api/podcasts/${selectedPodcast._id}/episodes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        await fetchEpisodes(selectedPodcast._id);
        setShowEpisodeForm(false);
        resetEpisodeForm();
      } else {
        const error = await response.json();
        alert('Lỗi: ' + (error.message || 'Không thể tạo episode'));
      }
    } catch (error) {
      console.error('Error creating episode:', error);
      alert('Lỗi khi tạo episode');
    }
  };

  // Delete podcast
  const handleDeletePodcast = async (podcastId) => {
    if (!confirm('Bạn có chắc chắn muốn xóa podcast này?')) return;
    
    try {
      const token = user?.token || (localStorage.getItem('cs_user') ? JSON.parse(localStorage.getItem('cs_user')).token : null);
      const response = await fetch(`http://localhost:5000/api/podcasts/${podcastId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchPodcasts();
        if (selectedPodcast && selectedPodcast._id === podcastId) {
          setSelectedPodcast(null);
          setEpisodes([]);
        }
      } else {
        alert('Lỗi khi xóa podcast');
      }
    } catch (error) {
      console.error('Error deleting podcast:', error);
      alert('Lỗi khi xóa podcast');
    }
  };

  // Delete episode
  const handleDeleteEpisode = async (episodeId) => {
    if (!confirm('Bạn có chắc chắn muốn xóa episode này?')) return;
    
    try {
      const token = user?.token || (localStorage.getItem('cs_user') ? JSON.parse(localStorage.getItem('cs_user')).token : null);
      const response = await fetch(`http://localhost:5000/api/podcasts/${selectedPodcast._id}/episodes/${episodeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchEpisodes(selectedPodcast._id);
      } else {
        alert('Lỗi khi xóa episode');
      }
    } catch (error) {
      console.error('Error deleting episode:', error);
      alert('Lỗi khi xóa episode');
    }
  };

  // Reset forms
  const resetPodcastForm = () => {
    setPodcastForm({
      title: '',
      description: '',
      host: '',
      hosts: '',
      category: 'Other',
      // language: 'vi',
      tags: '',
      website: '',
      isFeatured: false,
      type: 'series'
    });
    setCoverFile(null);
    setAudioFile(null);
  };

  const resetEpisodeForm = () => {
    setEpisodeForm({
      title: '',
      description: '',
      duration: '',
      showNotes: '',
      guests: '',
      tags: '',
      isExplicit: false,
      season: 1,
      episodeType: 'full'
    });
    setAudioFile(null);
  };

  // Format duration
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!user || user.role !== 'admin') {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#e5e5e5' }}>
        <h2>Không có quyền truy cập</h2>
        <p>Chỉ admin mới có thể xem trang quản lý podcast này.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#e5e5e5' }}>
        <h2>Đang tải...</h2>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
      position: 'relative'
    }}>
      <AdminSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      {/* Header */}
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
          Quản lý Podcast
        </h1>
      </div>

      {/* Main content */}
      <div style={{ 
        padding: '80px 20px 20px', 
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          borderBottom: '1px solid #2e2e37'
        }}>
          <button
            onClick={() => setActiveTab('podcasts')}
            style={{
              background: activeTab === 'podcasts' ? '#1db954' : 'transparent',
              color: '#e5e5e5',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
          >
            Podcasts ({podcasts.length})
          </button>
          <button
            onClick={() => setActiveTab('episodes')}
            style={{
              background: activeTab === 'episodes' ? '#1db954' : 'transparent',
              color: '#e5e5e5',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
          >
            Episodes ({episodes.length})
          </button>
        </div>

        {/* Podcasts Tab */}
        {activeTab === 'podcasts' && (
          <div>
            {/* Create Podcast Button */}
            <div style={{ marginBottom: '2rem' }}>
              <button
                onClick={() => setShowCreateForm(true)}
                style={{
                  background: '#1db954',
                  color: '#fff',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.background = '#1ed760'}
                onMouseLeave={(e) => e.target.style.background = '#1db954'}
              >
                <FaPlus /> Tạo Podcast Mới
              </button>
            </div>

            {/* Podcasts List */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}>
              {podcasts.map((podcast) => (
                <div
                  key={podcast._id}
                  style={{
                    background: '#1e1e24',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    border: '1px solid #2e2e37',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#1db954';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#2e2e37';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                  onClick={() => {
                    setSelectedPodcast(podcast);
                    // Only switch to episodes tab if it's a series podcast
                    if (podcast.type === 'series') {
                      setActiveTab('episodes');
                    }
                  }}
                >
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <img
                      src={podcast.cover ? `http://localhost:5000${podcast.cover}` : '/default-cover.png'}
                      alt={podcast.title}
                      style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '8px',
                        objectFit: 'cover'
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <h3 style={{ 
                        color: '#fff', 
                        margin: '0 0 0.5rem 0',
                        fontSize: '1.1rem',
                        fontWeight: '600'
                      }}>
                        {podcast.title}
                      </h3>
                      <p style={{ 
                        color: '#b3b3b3', 
                        margin: '0 0 0.5rem 0',
                        fontSize: '0.9rem'
                      }}>
                        Host: {podcast.host}
                      </p>
                      <p style={{ 
                        color: '#b3b3b3', 
                        margin: '0',
                        fontSize: '0.8rem'
                      }}>
                        {podcast.category} • {podcast.type === 'single' ? 'Single' : `${podcast.episodeCount || 0} episodes`}
                      </p>
                    </div>
                  </div>
                  
                  <p style={{ 
                    color: '#b3b3b3', 
                    fontSize: '0.9rem',
                    margin: '0 0 1rem 0',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {podcast.description}
                  </p>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPodcast(podcast);
                          setPodcastForm({
                            title: podcast.title,
                            description: podcast.description,
                            host: podcast.host,
                            hosts: podcast.hosts ? podcast.hosts.join(', ') : '',
                            category: podcast.category,
                            language: podcast.language,
                            tags: podcast.tags ? podcast.tags.join(', ') : '',
                            website: podcast.website || '',
                            isFeatured: podcast.isFeatured
                          });
                          setShowCreateForm(true);
                        }}
                        style={{
                          background: 'transparent',
                          border: '1px solid #2e2e37',
                          color: '#b3b3b3',
                          padding: '0.5rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.borderColor = '#1db954';
                          e.target.style.color = '#1db954';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.borderColor = '#2e2e37';
                          e.target.style.color = '#b3b3b3';
                        }}
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePodcast(podcast._id);
                        }}
                        style={{
                          background: 'transparent',
                          border: '1px solid #2e2e37',
                          color: '#b3b3b3',
                          padding: '0.5rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.borderColor = '#ff4444';
                          e.target.style.color = '#ff4444';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.borderColor = '#2e2e37';
                          e.target.style.color = '#b3b3b3';
                        }}
                      >
                        <FaTrash />
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: '#b3b3b3', fontSize: '0.8rem' }}>
                        {podcast.totalPlays || 0} plays
                      </span>
                      {podcast.isFeatured && (
                        <span style={{
                          background: '#1db954',
                          color: '#fff',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: '500'
                        }}>
                          Featured
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Episodes Tab */}
        {activeTab === 'episodes' && (
          <div>
            {selectedPodcast ? (
              <div>
                {/* Selected Podcast Info */}
                <div style={{
                  background: '#1e1e24',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  marginBottom: '2rem',
                  border: '1px solid #2e2e37'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img
                      src={selectedPodcast.cover ? `http://localhost:5000${selectedPodcast.cover}` : '/default-cover.png'}
                      alt={selectedPodcast.title}
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '8px',
                        objectFit: 'cover'
                      }}
                    />
                    <div>
                      <h3 style={{ color: '#fff', margin: '0 0 0.5rem 0' }}>
                        {selectedPodcast.title}
                      </h3>
                      <p style={{ color: '#b3b3b3', margin: '0' }}>
                        {selectedPodcast.type === 'single' ? 'Single Episode' : `${episodes.length} episodes`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Create Episode Button - Only show for series podcasts */}
                {selectedPodcast?.type === 'series' && (
                  <div style={{ marginBottom: '2rem' }}>
                    <button
                      onClick={() => setShowEpisodeForm(true)}
                      style={{
                        background: '#1db954',
                        color: '#fff',
                        border: 'none',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#1ed760'}
                      onMouseLeave={(e) => e.target.style.background = '#1db954'}
                    >
                      <FaPlus /> Thêm Episode Mới
                    </button>
                  </div>
                )}

                {/* Episodes List */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}>
                  {episodes.map((episode) => (
                    <div
                      key={episode._id}
                      style={{
                        background: '#1e1e24',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        border: '1px solid #2e2e37',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                            <h4 style={{ 
                              color: '#fff', 
                              margin: '0',
                              fontSize: '1.1rem',
                              fontWeight: '600'
                            }}>
                              Episode {episode.episodeNumber}: {episode.title}
                            </h4>
                            <span style={{
                              background: episode.episodeType === 'full' ? '#1db954' : '#ffa500',
                              color: '#fff',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              fontWeight: '500'
                            }}>
                              {episode.episodeType}
                            </span>
                          </div>
                          
                          <p style={{ 
                            color: '#b3b3b3', 
                            fontSize: '0.9rem',
                            margin: '0 0 1rem 0',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {episode.description}
                          </p>

                          <div style={{ display: 'flex', gap: '2rem', fontSize: '0.8rem', color: '#b3b3b3' }}>
                            <span>Duration: {formatDuration(episode.duration)}</span>
                            <span>Plays: {episode.plays || 0}</span>
                            <span>Downloads: {episode.downloads || 0}</span>
                            <span>Published: {new Date(episode.publishDate).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => {
                              setEditingEpisode(episode);
                              setEpisodeForm({
                                title: episode.title,
                                description: episode.description,
                                duration: episode.duration,
                                showNotes: episode.showNotes || '',
                                guests: episode.guests ? JSON.stringify(episode.guests) : '',
                                tags: episode.tags ? episode.tags.join(', ') : '',
                                isExplicit: episode.isExplicit,
                                season: episode.season,
                                episodeType: episode.episodeType
                              });
                              setShowEpisodeForm(true);
                            }}
                            style={{
                              background: 'transparent',
                              border: '1px solid #2e2e37',
                              color: '#b3b3b3',
                              padding: '0.5rem',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.borderColor = '#1db954';
                              e.target.style.color = '#1db954';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.borderColor = '#2e2e37';
                              e.target.style.color = '#b3b3b3';
                            }}
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteEpisode(episode._id)}
                            style={{
                              background: 'transparent',
                              border: '1px solid #2e2e37',
                              color: '#b3b3b3',
                              padding: '0.5rem',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.borderColor = '#ff4444';
                              e.target.style.color = '#ff4444';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.borderColor = '#2e2e37';
                              e.target.style.color = '#b3b3b3';
                            }}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '4rem 2rem',
                color: '#b3b3b3'
              }}>
                <h3>Chọn một podcast để xem episodes</h3>
                <p>Vui lòng chọn podcast từ tab Podcasts để xem danh sách episodes</p>
              </div>
            )}
          </div>
        )}

        {/* Create Podcast Modal */}
        {showCreateForm && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: '#1e1e24',
              borderRadius: '12px',
              padding: '2rem',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflowY: 'auto',
              border: '1px solid #2e2e37'
            }}>
              <h2 style={{ color: '#fff', margin: '0 0 2rem 0' }}>
                {editingPodcast ? 'Chỉnh sửa Podcast' : 'Tạo Podcast Mới'}
              </h2>
              
              <form onSubmit={editingPodcast ? handleUpdatePodcast : handleCreatePodcast}>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div>
                    <label style={{ color: '#e5e5e5', display: 'block', marginBottom: '0.5rem' }}>
                      Tên Podcast *
                    </label>
                    <input
                      type="text"
                      value={podcastForm.title}
                      onChange={(e) => setPodcastForm({...podcastForm, title: e.target.value})}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: '#2a2a35',
                        border: '1px solid #2e2e37',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '1rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ color: '#e5e5e5', display: 'block', marginBottom: '0.5rem' }}>
                      Mô tả *
                    </label>
                    <textarea
                      value={podcastForm.description}
                      onChange={(e) => setPodcastForm({...podcastForm, description: e.target.value})}
                      required
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: '#2a2a35',
                        border: '1px solid #2e2e37',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '1rem',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ color: '#e5e5e5', display: 'block', marginBottom: '0.5rem' }}>
                        Host chính *
                      </label>
                      <input
                        type="text"
                        value={podcastForm.host}
                        onChange={(e) => setPodcastForm({...podcastForm, host: e.target.value})}
                        required
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          background: '#2a2a35',
                          border: '1px solid #2e2e37',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '1rem'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ color: '#e5e5e5', display: 'block', marginBottom: '0.5rem' }}>
                        Thể loại *
                      </label>
                      <select
                        value={podcastForm.category}
                        onChange={(e) => setPodcastForm({...podcastForm, category: e.target.value})}
                        required
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          background: '#2a2a35',
                          border: '1px solid #2e2e37',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '1rem'
                        }}
                      >
                        {categories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ color: '#e5e5e5', display: 'block', marginBottom: '0.5rem' }}>
                      Host khác (phân cách bằng dấu phẩy)
                    </label>
                    <input
                      type="text"
                      value={podcastForm.hosts}
                      onChange={(e) => setPodcastForm({...podcastForm, hosts: e.target.value})}
                      placeholder="Host 1, Host 2, Host 3"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: '#2a2a35',
                        border: '1px solid #2e2e37',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '1rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ color: '#e5e5e5', display: 'block', marginBottom: '0.5rem' }}>
                      Tags (phân cách bằng dấu phẩy)
                    </label>
                    <input
                      type="text"
                      value={podcastForm.tags}
                      onChange={(e) => setPodcastForm({...podcastForm, tags: e.target.value})}
                      placeholder="tag1, tag2, tag3"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: '#2a2a35',
                        border: '1px solid #2e2e37',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '1rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ color: '#e5e5e5', display: 'block', marginBottom: '0.5rem' }}>
                      Loại Podcast *
                    </label>
                    <select
                      value={podcastForm.type}
                      onChange={(e) => setPodcastForm({...podcastForm, type: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: '#2a2a35',
                        border: '1px solid #2e2e37',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '1rem'
                      }}
                    >
                      <option value="series">Series (Nhiều tập)</option>
                      <option value="single">Single (Một tập duy nhất)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ color: '#e5e5e5', display: 'block', marginBottom: '0.5rem' }}>
                      Ảnh bìa
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setCoverFile(e.target.files[0])}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: '#2a2a35',
                        border: '1px solid #2e2e37',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '1rem'
                      }}
                    />
                  </div>

                  {podcastForm.type === 'single' && (
                    <div>
                      <label style={{ color: '#e5e5e5', display: 'block', marginBottom: '0.5rem' }}>
                        File Audio *
                      </label>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => setAudioFile(e.target.files[0])}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          background: '#2a2a35',
                          border: '1px solid #2e2e37',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '1rem'
                        }}
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      id="isFeatured"
                      checked={podcastForm.isFeatured}
                      onChange={(e) => setPodcastForm({...podcastForm, isFeatured: e.target.checked})}
                      style={{ transform: 'scale(1.2)' }}
                    />
                    <label htmlFor="isFeatured" style={{ color: '#e5e5e5' }}>
                      Podcast nổi bật
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <button
                    type="submit"
                    style={{
                      background: '#1db954',
                      color: '#fff',
                      border: 'none',
                      padding: '0.75rem 2rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: '500',
                      flex: 1
                    }}
                  >
                    {editingPodcast ? 'Cập nhật' : 'Tạo Podcast'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingPodcast(null);
                      resetPodcastForm();
                    }}
                    style={{
                      background: 'transparent',
                      color: '#b3b3b3',
                      border: '1px solid #2e2e37',
                      padding: '0.75rem 2rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: '500',
                      flex: 1
                    }}
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Episode Modal */}
        {showEpisodeForm && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: '#1e1e24',
              borderRadius: '12px',
              padding: '2rem',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflowY: 'auto',
              border: '1px solid #2e2e37'
            }}>
              <h2 style={{ color: '#fff', margin: '0 0 2rem 0' }}>
                {editingEpisode ? 'Chỉnh sửa Episode' : 'Thêm Episode Mới'}
              </h2>
              
              <form onSubmit={handleCreateEpisode}>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div>
                    <label style={{ color: '#e5e5e5', display: 'block', marginBottom: '0.5rem' }}>
                      Tên Episode *
                    </label>
                    <input
                      type="text"
                      value={episodeForm.title}
                      onChange={(e) => setEpisodeForm({...episodeForm, title: e.target.value})}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: '#2a2a35',
                        border: '1px solid #2e2e37',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '1rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ color: '#e5e5e5', display: 'block', marginBottom: '0.5rem' }}>
                      Mô tả *
                    </label>
                    <textarea
                      value={episodeForm.description}
                      onChange={(e) => setEpisodeForm({...episodeForm, description: e.target.value})}
                      required
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: '#2a2a35',
                        border: '1px solid #2e2e37',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '1rem',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ color: '#e5e5e5', display: 'block', marginBottom: '0.5rem' }}>
                      File Audio *
                    </label>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => setAudioFile(e.target.files[0])}
                      required={!editingEpisode}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: '#2a2a35',
                        border: '1px solid #2e2e37',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '1rem'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ color: '#e5e5e5', display: 'block', marginBottom: '0.5rem' }}>
                        Thời lượng (giây) *
                      </label>
                      <input
                        type="number"
                        value={episodeForm.duration}
                        onChange={(e) => setEpisodeForm({...episodeForm, duration: e.target.value})}
                        required
                        min="1"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          background: '#2a2a35',
                          border: '1px solid #2e2e37',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '1rem'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ color: '#e5e5e5', display: 'block', marginBottom: '0.5rem' }}>
                        Loại Episode
                      </label>
                      <select
                        value={episodeForm.episodeType}
                        onChange={(e) => setEpisodeForm({...episodeForm, episodeType: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          background: '#2a2a35',
                          border: '1px solid #2e2e37',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '1rem'
                        }}
                      >
                        {episodeTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ color: '#e5e5e5', display: 'block', marginBottom: '0.5rem' }}>
                      Show Notes
                    </label>
                    <textarea
                      value={episodeForm.showNotes}
                      onChange={(e) => setEpisodeForm({...episodeForm, showNotes: e.target.value})}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: '#2a2a35',
                        border: '1px solid #2e2e37',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '1rem',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ color: '#e5e5e5', display: 'block', marginBottom: '0.5rem' }}>
                      Tags (phân cách bằng dấu phẩy)
                    </label>
                    <input
                      type="text"
                      value={episodeForm.tags}
                      onChange={(e) => setEpisodeForm({...episodeForm, tags: e.target.value})}
                      placeholder="tag1, tag2, tag3"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: '#2a2a35',
                        border: '1px solid #2e2e37',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '1rem'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      id="isExplicit"
                      checked={episodeForm.isExplicit}
                      onChange={(e) => setEpisodeForm({...episodeForm, isExplicit: e.target.checked})}
                      style={{ transform: 'scale(1.2)' }}
                    />
                    <label htmlFor="isExplicit" style={{ color: '#e5e5e5' }}>
                      Nội dung người lớn
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <button
                    type="submit"
                    style={{
                      background: '#1db954',
                      color: '#fff',
                      border: 'none',
                      padding: '0.75rem 2rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: '500',
                      flex: 1
                    }}
                  >
                    {editingEpisode ? 'Cập nhật' : 'Thêm Episode'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEpisodeForm(false);
                      setEditingEpisode(null);
                      resetEpisodeForm();
                    }}
                    style={{
                      background: 'transparent',
                      color: '#b3b3b3',
                      border: '1px solid #2e2e37',
                      padding: '0.75rem 2rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: '500',
                      flex: 1
                    }}
                  >
                    Hủy
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

export default PodcastsAdmin;
