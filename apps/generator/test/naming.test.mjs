import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildContext } from '../core/context.mjs'

/** 最小可用定义：只保留推导路由需要的字段 */
function contextOf(entityName) {
  return buildContext({
    name: 'sys_whatever',
    entityName,
    displayName: entityName,
    module: 'whatever',
    basePackage: 'com.example.ddd',
    columns: [
      {
        name: 'id',
        javaName: 'id',
        type: 'long',
        primaryKey: true,
        autoIncrement: true,
      },
      { name: 'code', javaName: 'code', type: 'string', length: 32 },
    ],
  })
}

test('路由：取实体类名的小写形式', () => {
  assert.equal(contextOf('Order').route, 'order')
  assert.equal(contextOf('DemoItem').route, 'demoitem')
})
