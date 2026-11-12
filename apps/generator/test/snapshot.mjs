/**
 * 生成结果快照：`test/snapshots/<fixture>/` 下按产物路径存文件。
 *
 * 用途是把「同一份表定义必然产出同样的文件」锁住：模板或核心改动后
 * `pnpm --filter generator test` 会逐字节比对，任何非预期变化都会失败。
 * 确认变化符合预期后，用 `node test/update-snapshots.mjs` 重建。
 */
import {
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeGenerated } from './helpers.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const SNAPSHOT_DIR = path.join(HERE, 'snapshots')

/** 生成结果 → 可比较的纯文本映射（时间戳 / UUID 已归一化） */
export function toSnapshot(files) {
  const normalized = normalizeGenerated(files)
  return Object.fromEntries(
    Object.entries(normalized).map(([key, value]) => [key, String(value)]),
  )
}

export function readSnapshot(name) {
  const root = path.join(SNAPSHOT_DIR, name)
  const files = {}
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry)
      if (statSync(full).isDirectory()) walk(full)
      else files[path.relative(root, full)] = readFileSync(full, 'utf8')
    }
  }
  walk(root)
  return files
}

export function writeSnapshot(name, files) {
  const root = path.join(SNAPSHOT_DIR, name)
  rmSync(root, { recursive: true, force: true })
  for (const [relative, content] of Object.entries(files)) {
    const target = path.join(root, relative)
    mkdirSync(path.dirname(target), { recursive: true })
    writeFileSync(target, content, 'utf8')
  }
}
