import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// Mount on a specific element, e.g., 'react-root' or fallback to 'root' if empty
const rootElement = document.getElementById('react-root') || document.getElementById('root')

if (rootElement) {
  // Check if root already has content (Legacy App). If so, we might want to append or replace.
  // For this migration, we will create a NEW container in the homeHTML to avoid conflicts.
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
} else {
    console.warn("React root element not found. Skipping React mount.")
}