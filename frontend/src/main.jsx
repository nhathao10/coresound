import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Upload from './Upload.jsx'
import AlbumsAdmin from './AlbumsAdmin.jsx'
import AlbumDetail from './AlbumDetail.jsx'
import { PlayerProvider } from './PlayerContext.jsx'
import GlobalPlayer from './GlobalPlayer.jsx'

function Router() {
  const hash = window.location.hash || '#/'
  if (hash.startsWith('#/upload')) {
    return <Upload />
  }
  if (hash.startsWith('#/albums-admin')) {
    return <AlbumsAdmin />
  }
  if (hash.startsWith('#/album/')) {
    return <AlbumDetail />
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
      <PlayerProvider>
        <Router />
        <GlobalPlayer />
      </PlayerProvider>
    </StrictMode>
  )
}

createRoot(document.getElementById('root')).render(<Root />)
