interface RGB {
  r: number
  g: number
  b: number
}

interface HSL {
  h: number
  s: number
  l: number
}

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i

/** 归一化用户输入：接受 #abc / abc / #aabbcc，返回 #aabbcc；非法返回 null */
export function normalizeHex(input: string): string | null {
  const trimmed = input.trim()
  if (!HEX_RE.test(trimmed)) return null
  let hex = trimmed.replace('#', '')
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('')
  }
  return `#${hex.toUpperCase()}`
}

function hexToRgb(hex: string): RGB {
  const normalized = normalizeHex(hex) ?? '#000000'
  const value = normalized.slice(1)
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  }
}

function rgbToHex({ r, g, b }: RGB): string {
  const toHex = (n: number) =>
    Math.round(Math.min(255, Math.max(0, n)))
      .toString(16)
      .padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
}

function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const delta = max - min
  const l = (max + min) / 2

  let h = 0
  let s = 0

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1))
    switch (max) {
      case rn:
        h = ((gn - bn) / delta) % 6
        break
      case gn:
        h = (bn - rn) / delta + 2
        break
      default:
        h = (rn - gn) / delta + 4
    }
    h *= 60
    if (h < 0) h += 360
  }

  return { h, s: s * 100, l: l * 100 }
}

function hslToRgb({ h, s, l }: HSL): RGB {
  const sn = Math.min(100, Math.max(0, s)) / 100
  const ln = Math.min(100, Math.max(0, l)) / 100
  const c = (1 - Math.abs(2 * ln - 1)) * sn
  const hp = (((h % 360) + 360) % 360) / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))

  let rgb: [number, number, number] = [0, 0, 0]
  if (hp >= 0 && hp < 1) rgb = [c, x, 0]
  else if (hp < 2) rgb = [x, c, 0]
  else if (hp < 3) rgb = [0, c, x]
  else if (hp < 4) rgb = [0, x, c]
  else if (hp < 5) rgb = [x, 0, c]
  else rgb = [c, 0, x]

  const m = ln - c / 2
  return {
    r: (rgb[0] + m) * 255,
    g: (rgb[1] + m) * 255,
    b: (rgb[2] + m) * 255,
  }
}

/** HEX → HSL（h 为 0-360，s/l 为百分比数值），供色相滑条使用 */
export function hexToHsl(hex: string): HSL {
  return rgbToHsl(hexToRgb(hex))
}

/** HSL → HEX，用于滑条拖动后的回写 */
export function hslToHex(hsl: HSL): string {
  return rgbToHex(hslToRgb(hsl))
}

/** Relative luminance per WCAG 2.1 */
function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex)
  const channel = (v: number) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** WCAG 对比度：用于提示主色上的文字是否可读 */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  const [light, dark] = la > lb ? [la, lb] : [lb, la]
  return (light + 0.05) / (dark + 0.05)
}

/**
 * Pick a readable foreground (white or near-black) for the given background.
 * 偏向白色：主色底上的按钮/徽标默认白字，仅当白色对比度不足 3:1（底色过浅，
 * 白字不可读）时才回退到深色文本。
 */
export function readableOn(background: string): string {
  const white = '#FFFFFF'
  const black = '#111827'
  return contrastRatio(background, white) >= 3 ? white : black
}

/**
 * antd v5 图表色板（@ant-design/plots 默认）：主色在前，其余按 antd 的
 * 分类色序补齐。自定义主色时只有首色跟随，其余保持 antd 的固定色序，
 * 避免整盘图表随主色偏移成单色调。
 */
const ANT_CHART_COLORS = [
  '#5B8FF9',
  '#5AD8A6',
  '#5D7092',
  '#F6BD16',
  '#E8684A',
  '#6DC8EC',
  '#9270CA',
  '#FF9D4D',
  '#269A99',
  '#FF99C3',
]

/** 图表色板：首色始终等于当前主色，其余沿用 antd 色序（去重） */
export function chartPalette(primary: string): string[] {
  const rest = ANT_CHART_COLORS.filter(
    (c) => c.toLowerCase() !== primary.toLowerCase(),
  )
  return [primary, ...rest].slice(0, 10)
}

/**
 * 主题色混合：按权重把主色混入指定底色。
 * 登录页的深色渐变背景与图表辅色都用它，保证与主题色同步。
 */
export function mixPrimary(weight: number, base = '#0b1220') {
  return `color-mix(in oklab, var(--primary) ${weight}%, ${base})`
}
