import { get } from '@/lib/http'

export interface MonitorNode {
  name: string
  region: string
  cpu: number
  mem: number
  alerting: boolean
}

export interface MonitorData {
  summary: { label: string; value: string }[]
  times: string[]
  cpu: number[]
  network: { inbound: number[]; outbound: number[] }
  health: number
  nodes: MonitorNode[]
}

export function fetchMonitor() {
  return get<MonitorData>('/monitor')
}
