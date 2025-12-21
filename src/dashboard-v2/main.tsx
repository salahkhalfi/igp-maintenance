/**
 * Dashboard V2 - Entry Point
 * 
 * Point d'entrée React moderne pour le nouveau dashboard.
 * Isolé du legacy pour migration progressive.
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// Mount sur l'élément dédié dashboard-v2
const rootElement = document.getElementById('dashboard-v2-root')

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
} else {
  console.error('[Dashboard V2] Root element #dashboard-v2-root not found')
}
