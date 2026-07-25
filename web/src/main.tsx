import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registrarOverlays } from './lib/overlays'

// Antes de montar nada: los overlays propios (formas, regla, fibonacci
// acotado) deben existir cuando el gráfico restaure dibujos guardados.
registrarOverlays()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
