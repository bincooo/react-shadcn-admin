import { get } from '@/lib/http'

export interface StatItem {
  key: string
  label: string
  value: number
  prefix?: string
  suffix?: string
  delta: number
  up: boolean
  tone: 'primary' | 'success' | 'warning' | 'info'
}

export interface DashboardData {
  stats: StatItem[]
  traffic: { months: number[]; visits: number[]; orders: number[] }
  sources: { nameKey: string; value: number }[]
  recentOrders: {
    name: string
    amount: number
    statusKey: string
    variant: 'success' | 'warning' | 'secondary'
  }[]
  quickLinks: { label: string; path: string }[]
}

export function fetchDashboard() {
  return get<DashboardData>('/dashboard')
}
