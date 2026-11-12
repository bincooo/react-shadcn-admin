import { test } from 'node:test'
import assert from 'node:assert/strict'
import { generateFiles } from '../core/generator.mjs'
import { loadFixture, normalizeGenerated } from './helpers.mjs'
import { readSnapshot, toSnapshot } from './snapshot.mjs'

/** 用固定定义生成，并与快照逐文件比对 */
function assertSnapshot(fixture) {
  const generated = generateFiles(loadFixture(fixture))
  assert.deepEqual(toSnapshot(generated.files), readSnapshot(fixture))
  return generated
}

test('sys_order 生成结果与快照一致', () => {
  const generated = assertSnapshot('order')
  assert.equal(generated.summary.entity, 'Order')
  assert.equal(generated.summary.fileCount, Object.keys(generated.files).length)
})

test('全列类型 + 明细表生成结果与快照一致', () => {
  const generated = assertSnapshot('demo')
  assert.equal(generated.summary.entity, 'Demo')
  assert.equal(generated.summary.detailCount, 1)
  assert.equal(generated.summary.fileCount, Object.keys(generated.files).length)
})

test('生成结果可重复：同一份定义连续两次完全一致', () => {
  const fixture = loadFixture('demo')
  const first = toSnapshot(generateFiles(fixture).files)
  const second = toSnapshot(generateFiles(fixture).files)
  assert.deepEqual(first, second)
})

test('时间戳归一化后不再残留运行期信息', () => {
  const generated = generateFiles(loadFixture('order'))
  const normalized = normalizeGenerated(generated)
  assert.equal(normalized.summary.table, 'sys_order')
  assert.ok(
    !/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(JSON.stringify(normalized)),
  )
})
