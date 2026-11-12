/**
 * 重建快照：`node test/update-snapshots.mjs`
 *
 * 仅在确认生成结果的变化符合预期后执行；否则说明模板/核心出现了回归。
 */
import { generateFiles } from '../core/generator.mjs'
import { loadFixture } from './helpers.mjs'
import { toSnapshot, writeSnapshot } from './snapshot.mjs'

const FIXTURES = ['order', 'demo']

for (const fixture of FIXTURES) {
  const generated = generateFiles(loadFixture(fixture))
  writeSnapshot(fixture, toSnapshot(generated.files))
  console.log(`✔ ${fixture}: ${Object.keys(generated.files).length} 个文件`)
}
