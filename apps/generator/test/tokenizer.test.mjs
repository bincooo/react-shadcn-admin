import { test } from 'node:test'
import assert from 'node:assert/strict'
import { compile } from '../core/tokenizer/repository.mjs'
import { renderNodes, createScope } from '../core/tokenizer/render.mjs'
import { tokenize } from '../core/tokenizer/tokenize.mjs'
import { evaluateExpression } from '../core/tokenizer/expression/evaluate.mjs'
import { applyBuiltin } from '../core/tokenizer/expression/builtins.mjs'
import { stripDirectiveLines } from '../core/tokenizer/preprocess.mjs'

/** 渲染一段内联模板 */
function render(source, model = {}) {
  return renderNodes(compile(source), createScope(model))
}

test('词法：区分文本、插值、标签，丢弃注释', () => {
  const tokens = tokenize('a${x}<#if y>b</#if><#-- c -->d')
  assert.deepEqual(
    tokens.map((token) => token.type),
    ['text', 'interp', 'tag', 'text', 'tag', 'text'],
  )
  assert.equal(tokens[2].value, 'if y')
  assert.equal(tokens[4].value, '/if')
})

test('词法：\\${ 输出字面量 ${', () => {
  assert.equal(render('\\' + '${a}'), '${a}')
})
test('语法：if / elseif / else 分支', () => {
  const template = '<#if a>A<#elseif b>B<#else>C</#if>'
  assert.equal(render(template, { a: true, b: true }), 'A')
  assert.equal(render(template, { a: false, b: true }), 'B')
  assert.equal(render(template, { a: false, b: false }), 'C')
})

test('语法：list 循环变量与 has_next', () => {
  assert.equal(
    render(
      '<#list items as item>' +
        '${item}' +
        '<#if item_has_next>,</#if></#list>',
      {
        items: ['a', 'b'],
      },
    ),
    'a,b',
  )
})

test('语法：assign 写入当前作用域', () => {
  assert.equal(render('<#assign x = "hi">' + '${x}' + '!'), 'hi!')
})

test('表达式：优先级与单词别名', () => {
  assert.equal(evaluateExpression('1 + 2 == 3', createScope({})), true)
  assert.equal(
    evaluateExpression('a gt 1 and b lt 3', createScope({ a: 2, b: 2 })),
    true,
  )
  assert.equal(evaluateExpression('!false && true', createScope({})), true)
  assert.equal(evaluateExpression("'a' + 'b'", createScope({})), 'ab')
})

test('表达式：属性访问与内建链', () => {
  const scope = createScope({ user: { name: 'order' } })
  assert.equal(evaluateExpression('user.name?upper_case', scope), 'ORDER')
  assert.equal(
    evaluateExpression('items?size', createScope({ items: [1, 2] })),
    2,
  )
  assert.equal(evaluateExpression('missing?default("x")', createScope({})), 'x')
})

test('内建：js / jsx / java 字面量', () => {
  assert.equal(applyBuiltin("it's", 'js', []), "'it\\'s'")
  assert.equal(applyBuiltin('中文', 'jsx', []), '{"中文"}')
  assert.equal(applyBuiltin('中文', 'java', []), '"中文"')
  assert.throws(() => applyBuiltin('x', 'nope', []), /不支持的内建/)
})

test('预处理：只含标签的行去掉缩进与换行', () => {
  const source = 'a\n    <#if x>\n    b\n    </#if>\nc'
  // 指令行只保留标签本身、不补换行，因此下一行会紧接在标签之后
  assert.equal(stripDirectiveLines(source), 'a\n<#if x>    b\n</#if>c')
})

test('渲染：对象不输出、数组用逗号连接', () => {
  assert.equal(render('${a}' + '${b}', { a: { x: 1 }, b: [1, 2] }), '1, 2')
  assert.equal(render('${missing}', {}), '')
})

test('错误：未闭合的标签 / 插值给出明确信息', () => {
  assert.throws(() => tokenize('<#if x'), /标签未闭合/)
  assert.throws(() => tokenize('${x'), /插值未闭合/)
  assert.throws(() => compile('<#nope x>'), /不支持的标签/)
  assert.throws(() => compile('<#if a></#list>'), /意外的结束标签/)
})
