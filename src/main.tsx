import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './context/ThemeProvider'

// Las pantallas se cargan bajo demanda. Si se publica una versión nueva con la
// pestaña abierta, los chunks viejos ya no existen y el import falla: se recarga
// para traer la versión nueva en vez de dejar la pantalla en blanco. Como mucho
// una vez cada 10 s, para no entrar en un bucle si el problema es otro.
const RELOAD_KEY = 'bys-chunk-reload-at'
window.addEventListener('vite:preloadError', (event) => {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0)
    if (Date.now() - last < 10_000) return
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
  } catch {
    return
  }
  event.preventDefault()
  window.location.reload()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
