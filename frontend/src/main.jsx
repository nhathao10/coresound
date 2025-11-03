import React, { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './mobile.css'
import App from './App.jsx'
import Upload from './Upload.jsx'
import AlbumsAdmin from './AlbumsAdmin.jsx'
import ArtistsAdmin from './ArtistsAdmin.jsx'
import GenresAdmin from './GenresAdmin.jsx'
import RegionsAdmin from './RegionsAdmin.jsx'
import UsersAdmin from './UsersAdmin.jsx'
import LyricsAdmin from './LyricsAdmin.jsx'
import PlaylistsAdmin from './PlaylistsAdmin.jsx'
import StatisticsAdmin from './StatisticsAdmin.jsx'
import PodcastsAdmin from './PodcastsAdmin.jsx'
import PlaylistDetail from './PlaylistDetail.jsx'
import Profile from './Profile.jsx'
import PremiumSuccess from './PremiumSuccess.jsx'
import Favorites from './Favorites.jsx'
import Library from './Library.jsx'
import AlbumDetail from './AlbumDetail.jsx'
import ArtistDetail from './ArtistDetail.jsx'
import GenreBrowser from './GenreBrowser.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'
import { PlayerProvider } from './PlayerContext.jsx'
import { SearchProvider } from './SearchContext.jsx'
import { AuthProvider } from './AuthContext.jsx'
import { ToastProvider } from './ToastContext.jsx'
import { FavoritesProvider } from './FavoritesContext.jsx'
import GlobalPlayer from './GlobalPlayer.jsx'
import AddToPlaylistModal from './AddToPlaylistModal.jsx'
import MobilePlayer from './MobilePlayer.jsx'
import MobileNavDrawer from './MobileNavDrawer.jsx'

function Router() {
  const hash = window.location.hash || '#/'
  if (hash.startsWith('#/upload')) {
    return (
      <ProtectedRoute requireAdmin={true}>
        <Upload />
      </ProtectedRoute>
    )
  }
  if (hash.startsWith('#/albums-admin')) {
    return (
      <ProtectedRoute requireAdmin={true}>
        <AlbumsAdmin />
      </ProtectedRoute>
    )
  }
  if (hash.startsWith('#/artists-admin')) {
    return (
      <ProtectedRoute requireAdmin={true}>
        <ArtistsAdmin />
      </ProtectedRoute>
    )
  }
  if (hash.startsWith('#/genres-admin')) {
    return (
      <ProtectedRoute requireAdmin={true}>
        <GenresAdmin />
      </ProtectedRoute>
    )
  }
  if (hash.startsWith('#/regions-admin')) {
    return (
      <ProtectedRoute requireAdmin={true}>
        <RegionsAdmin />
      </ProtectedRoute>
    )
  }
  if (hash.startsWith('#/users-admin')) {
    return (
      <ProtectedRoute requireAdmin={true}>
        <UsersAdmin />
      </ProtectedRoute>
    )
  }
  if (hash.startsWith('#/lyrics-admin')) {
    return (
      <ProtectedRoute requireAdmin={true}>
        <LyricsAdmin />
      </ProtectedRoute>
    )
  }
  if (hash.startsWith('#/playlists-admin')) {
    return (
      <ProtectedRoute requireAdmin={true}>
        <PlaylistsAdmin />
      </ProtectedRoute>
    )
  }
  if (hash.startsWith('#/statistics-admin')) {
    return (
      <ProtectedRoute requireAdmin={true}>
        <StatisticsAdmin />
      </ProtectedRoute>
    )
  }
  if (hash.startsWith('#/podcasts-admin')) {
    return (
      <ProtectedRoute requireAdmin={true}>
        <PodcastsAdmin />
      </ProtectedRoute>
    )
  }
  if (hash.startsWith('#/profile')) {
    return (
      <ProtectedRoute requireAdmin={false}>
        <Profile />
      </ProtectedRoute>
    )
  }
  if (hash.startsWith('#/premium-success')) {
    return (
      <ProtectedRoute requireAdmin={false}>
        <PremiumSuccess />
      </ProtectedRoute>
    )
  }
  if (hash.startsWith('#/favorites')) {
    return (
      <ProtectedRoute requireAdmin={false}>
        <Favorites />
      </ProtectedRoute>
    )
  }
  if (hash.startsWith('#/library')) {
    return (
      <ProtectedRoute requireAdmin={false}>
        <Library />
      </ProtectedRoute>
    )
  }
  if (hash.startsWith('#/album/')) {
    return <AlbumDetail />
  }
  if (hash.startsWith('#/artist/')) {
    return <ArtistDetail />
  }
  if (hash.startsWith('#/genres')) {
    return <GenreBrowser />
  }
  if (hash.startsWith('#/playlist/')) {
    return <PlaylistDetail />
  }
  return <App />
}

function Root() {
  const [_, force] = React.useReducer((x) => x + 1, 0)
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = React.useState(false)
  const [selectedSongForPlaylist, setSelectedSongForPlaylist] = React.useState(null)
  const [hideGlobalPlayer, setHideGlobalPlayer] = React.useState(false)
  const [showMobileNav, setShowMobileNav] = React.useState(false)
  const [isMobile, setIsMobile] = React.useState(false)
  
  // Detect mobile
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  React.useEffect(() => {
    const onHash = () => force()
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  
  // Listen for openAddToPlaylist event from GlobalPlayer
  React.useEffect(() => {
    const handleOpenAddToPlaylist = (event) => {
      setSelectedSongForPlaylist(event.detail.song)
      setShowAddToPlaylistModal(true)
    }

    window.addEventListener('openAddToPlaylist', handleOpenAddToPlaylist)
    return () => window.removeEventListener('openAddToPlaylist', handleOpenAddToPlaylist)
  }, [])
  
  // Listen for game modal open/close events
  React.useEffect(() => {
    const handleGameModalOpen = () => setHideGlobalPlayer(true)
    const handleGameModalClose = () => setHideGlobalPlayer(false)

    window.addEventListener('gameModalOpen', handleGameModalOpen)
    window.addEventListener('gameModalClose', handleGameModalClose)
    return () => {
      window.removeEventListener('gameModalOpen', handleGameModalOpen)
      window.removeEventListener('gameModalClose', handleGameModalClose)
    }
  }, [])

  // Listen for mobile nav open event
  React.useEffect(() => {
    const handleOpenMobileNav = () => setShowMobileNav(true)
    window.addEventListener('openMobileNav', handleOpenMobileNav)
    return () => window.removeEventListener('openMobileNav', handleOpenMobileNav)
  }, [])
  
  // Check if current route should hide the player
  const hash = window.location.hash || '#/'
  const hidePlayer = hash.startsWith('#/statistics-admin') || 
                    hash.startsWith('#/playlists-admin') ||
                    hash.startsWith('#/podcasts-admin') ||
                    hash.startsWith('#/albums-admin') ||
                    hash.startsWith('#/artists-admin') ||
                    hash.startsWith('#/genres-admin') ||
                    hash.startsWith('#/regions-admin') ||
                    hash.startsWith('#/users-admin') ||
                    hash.startsWith('#/lyrics-admin') ||
                    hash.startsWith('#/upload')
  
  return (
    <StrictMode>
      <ToastProvider>
        <AuthProvider>
          <FavoritesProvider>
            <SearchProvider>
              <PlayerProvider>
                <Router />
                {/* Desktop Player */}
                {!hidePlayer && !hideGlobalPlayer && !isMobile && <GlobalPlayer />}

                {/* Mobile Player */}
                {!hidePlayer && !hideGlobalPlayer && isMobile && <MobilePlayer />}

                {/* Mobile Navigation Drawer */}
                {isMobile && (
                  <MobileNavDrawer
                    isOpen={showMobileNav}
                    onClose={() => setShowMobileNav(false)}
                  />
                )}

                <AddToPlaylistModal
                  isOpen={showAddToPlaylistModal}
                  onClose={() => {
                    setShowAddToPlaylistModal(false)
                    setSelectedSongForPlaylist(null)
                  }}
                  song={selectedSongForPlaylist}
                />
              </PlayerProvider>
            </SearchProvider>
          </FavoritesProvider>
        </AuthProvider>
      </ToastProvider>
    </StrictMode>
  )
}

createRoot(document.getElementById('root')).render(<Root />)
