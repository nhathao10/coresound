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
import Profile from './Profile.jsx'
import Favorites from './Favorites.jsx'
import Library from './Library.jsx'
import AlbumDetail from './AlbumDetail.jsx'
import ArtistDetail from './ArtistDetail.jsx'
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
  return <App />
}

function Root() {
  const [_, force] = React.useReducer((x) => x + 1, 0)
  React.useEffect(() => {
    const onHash = () => force()
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  return (
    <StrictMode>
      <ToastProvider>
        <AuthProvider>
          <FavoritesProvider>
            <SearchProvider>
              <PlayerProvider>
                <Router />
                <GlobalPlayer />
              </PlayerProvider>
            </SearchProvider>
          </FavoritesProvider>
        </AuthProvider>
      </ToastProvider>
    </StrictMode>
  )
}

createRoot(document.getElementById('root')).render(<Root />)
