import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './i18n'
import './index.css'
import { initThemeRuntime } from '@/lib/theme-runtime'
import App from './App'

// 首屏渲染前写入主题 CSS 变量，避免明暗模式闪烁
const disposeThemeRuntime = initThemeRuntime()
// HMR 重载模块时释放旧的 store / 系统主题订阅，避免重复写入
if (import.meta.hot) import.meta.hot.dispose(disposeThemeRuntime)

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
