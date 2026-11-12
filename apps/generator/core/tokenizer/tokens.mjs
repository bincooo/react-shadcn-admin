/**
 * 模板引擎各层共用的 token / 节点类型与字符表。
 *
 * 集中定义避免字符串字面量散落在 tokenizer、parser、renderer 三处。
 */

/** 词法 token 类型 */
export const TOKEN = {
  TEXT: 'text',
  INTERP: 'interp',
  TAG: 'tag',
  STRING: 'string',
  NUMBER: 'number',
  IDENT: 'ident',
  OP: 'op',
}

/** 语法树节点类型 */
export const NODE = {
  TEXT: 'text',
  INTERP: 'interp',
  ASSIGN: 'assign',
  IF: 'if',
  LIST: 'list',
}

/** 表达式字符串字面量的转义表 */
export const STRING_ESCAPES = { n: '\n', t: '\t', r: '\r' }

/** 关系运算符：单词别名（FTL 惯用写法 gt / lt / gte / lte） */
export const RELATIONAL_ALIASES = { gt: '>', lt: '<', gte: '>=', lte: '<=' }

/** 双字符运算符，必须先于单字符匹配 */
export const MULTI_CHAR_OPS = ['==', '!=', '>=', '<=', '&&', '||']

/** 单字符运算符 */
export const SINGLE_CHAR_OPS = '+-!()<>.,?='

/** 模板标记 */
export const TAG_OPEN = '<#'
export const TAG_CLOSE = '</#'
export const COMMENT_OPEN = '<#--'
export const COMMENT_CLOSE = '-->'
export const INTERPOLATION_OPEN = '${'
export const ESCAPED_INTERPOLATION = '\\${'

/** 分支标签（只对块级标签有效） */
export const BRANCH_ELSE = 'else'
export const BRANCH_ELSEIF = 'elseif'
