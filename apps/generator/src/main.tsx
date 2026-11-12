import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { initTheme } from '@/lib/theme'
import App from './App'

initTheme()

const container = document.getElementById('root')
if (!container) throw new Error('未找到 #root 挂载节点')

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
