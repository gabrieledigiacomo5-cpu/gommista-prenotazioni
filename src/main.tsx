import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './business/fonts'
import './index.css'
import App from './App.tsx'
import { applyBusinessTheme } from './business'

applyBusinessTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
