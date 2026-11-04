import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './i18n'
import './index.css'
import { initThemeRuntime } from '@/lib/theme/theme-runtime'
import App from './App'

// 首屏渲染前写入主题 CSS 变量，避免明暗模式闪烁
initThemeRuntime()

const baseURL = import.meta.env.VITE_PREFIX ?? ''
const container = document.getElementById('root')
if (!container) throw new Error('未找到 #root 挂载节点')

createRoot(container).render(
  <StrictMode>
    <BrowserRouter basename={baseURL}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
