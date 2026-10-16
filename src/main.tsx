import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { useSettingsStore } from './stores/settingsStore'
import './index.css'

useSettingsStore.getState().hydrate()

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element #root not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
