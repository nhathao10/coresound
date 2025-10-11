import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
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
  React.useEffect(() => {
    const onHash = () => force()
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
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
                {!hidePlayer && <GlobalPlayer />}
              </PlayerProvider>
            </SearchProvider>
          </FavoritesProvider>
        </AuthProvider>
      </ToastProvider>
    </StrictMode>
  )
}

createRoot(document.getElementById('root')).render(<Root />)
