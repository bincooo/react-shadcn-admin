import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const FIXTURE_DIR = path.join(HERE, 'fixtures')

/** 读取固定测试定义（不含随机 id / 时间戳） */
export function loadFixture(name) {
  const file = path.join(FIXTURE_DIR, `${name}.json`)
  return JSON.parse(readFileSync(file, 'utf8'))
}

const ISO_TIMESTAMP = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g

/**
 * 把生成结果里的运行期信息归一化，便于逐字节比较：
 * - 时间戳（SQL 头部 / manifest / README）
 * - 随机 UUID（归一化时补齐的审计列 id 等）
 */
export function normalizeGenerated(value) {
  return JSON.parse(
    JSON.stringify(value)
      .replace(ISO_TIMESTAMP, '<TIMESTAMP>')
      .replace(
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g,
        '<UUID>',
      ),
  )
}
