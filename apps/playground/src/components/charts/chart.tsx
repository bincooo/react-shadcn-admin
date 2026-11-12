/**
 * echarts 容器组件：按需引入（≈570KB）单独成 chunk，首次渲染图表时再加载。
 *
 * `charts/` 只放图表相关：`chart` 负责实例生命周期，`chart-theme` 是与 echarts
 * 解耦的配置类型与共用字号，让图表页不必静态引入 echarts。
 */
import { useEffect, useRef, useState } from 'react'
import type { ECharts } from 'echarts/core'
import type * as EChartsModule from '@/lib/echarts'
import { chartPalette } from '@/lib/color'
import { useThemeStore } from '@/store/theme'
import type { ChartOption } from './chart-theme'

export type { ChartOption }

/**
 * echarts 按需引入（≈570KB）单独成 chunk：首次渲染图表时再加载，
 * 首屏与登录页不必为图表付出体积。渲染器只初始化一次。
 */
let echartsLoader: Promise<typeof EChartsModule> | null = null
function loadEcharts() {
  echartsLoader ??= import('@/lib/echarts')
  return echartsLoader
}

interface ChartProps {
  option: ChartOption
  height?: number | string
  /** 无障碍描述：图表所在的标题 */
  ariaLabel?: string
}

// 字体栈是静态的，只读一次（getComputedStyle 会强制同步样式计算）
let chartFontFamily: string | undefined

/**
 * 轻量 ECharts 封装：随主题色板自动重绘，随容器尺寸自适应，实例复用。
 */
export function Chart({ option, height = 280, ariaLabel }: ChartProps) {
  const ref = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ECharts | null>(null)
  const [readyState, setReady] = useState(false)
  const primaryColor = useThemeStore((s) => s.primaryColor)

  useEffect(() => {
    let instance: ECharts | null = null
    let observer: ResizeObserver | null = null
    let cancelled = false

    void loadEcharts()
      .then((echarts) => {
        if (cancelled || !ref.current) return
        try {
          // HMR / StrictMode 下 DOM 上可能残留已销毁实例：先清掉再初始化，
          // 否则 echarts.init 会复用旧实例，后续 setOption 可能抛出内部状态错误。
          echarts.getInstanceByDom(ref.current)?.dispose()
          instance = echarts.init(ref.current)
          chartRef.current = instance
          observer = new ResizeObserver(() => {
            if (!instance?.isDisposed()) instance?.resize()
          })
          observer.observe(ref.current)
          // 库就绪后再触发一次 setOption，避免首帧空白
          setReady(true)
        } catch (error) {
          if (!cancelled) console.error('[Chart] init failed', error)
        }
      })
      .catch((error) => {
        if (!cancelled) console.error('[Chart] failed to load echarts', error)
      })

    return () => {
      cancelled = true
      observer?.disconnect()
      try {
        instance?.dispose()
      } catch {
        // 实例可能已被 echarts 内部销毁
      }
      chartRef.current = null
    }
  }, [])

  useEffect(() => {
    const instance = chartRef.current
    if (!instance || instance.isDisposed() || !readyState) return

    chartFontFamily ??= getComputedStyle(document.body).fontFamily
    try {
      instance.setOption(
        {
          color: chartPalette(primaryColor),
          textStyle: { fontFamily: chartFontFamily },
          ...option,
        },
        { notMerge: true },
      )
    } catch (error) {
      // 图表异常不应让整页进入错误边界（导航/表格仍可用）
      console.error('[Chart] setOption failed', error)
    }
    // 明暗模式已在调用方合成进 option，这里无需单独依赖
  }, [option, primaryColor, readyState])

  return (
    <div
      ref={ref}
      role="img"
      aria-label={ariaLabel}
      className="w-full"
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    />
  )
}
