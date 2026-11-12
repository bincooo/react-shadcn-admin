/**
 * 轻量语法高亮：生成的产物只有 Java / SQL / JSON / Markdown 四类，
 * 用一组正则做分词，避免为代码预览引入重型高亮依赖。
 */

export type Language =
  | 'java'
  | 'typescript'
  | 'sql'
  | 'json'
  | 'markdown'
  | 'plain'

export type TokenType =
  | 'plain'
  | 'comment'
  | 'string'
  | 'annotation'
  | 'keyword'
  | 'number'
  | 'type'
  | 'constant'
  | 'key'
  | 'boolean'
  | 'identifier'
  | 'heading'
  | 'quote'
  | 'list'
  | 'inlinecode'
  | 'emphasis'
  | 'link'
  | 'codeblock'

export interface Token {
  text: string
  type: TokenType
}

const EXTENSION_LANGUAGE: Record<string, Language> = {
  java: 'java',
  ts: 'typescript',
  tsx: 'typescript',
  sql: 'sql',
  json: 'json',
  md: 'markdown',
  markdown: 'markdown',
}

export function detectLanguage(path: string | null | undefined): Language {
  if (!path) return 'plain'
  const extension = path.split('.').pop()?.toLowerCase() ?? ''
  return EXTENSION_LANGUAGE[extension] ?? 'plain'
}

const LANGUAGE_LABELS: Record<Language, string> = {
  java: 'JAVA',
  typescript: 'TS',
  sql: 'SQL',
  json: 'JSON',
  markdown: 'MD',
  plain: 'TEXT',
}

export function languageLabel(language: Language): string {
  return LANGUAGE_LABELS[language]
}

const JAVA_KEYWORDS =
  'abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|extends|final|finally|float|for|goto|if|implements|import|instanceof|int|interface|long|native|new|package|permits|private|protected|public|record|return|sealed|short|static|strictfp|super|switch|synchronized|this|throw|throws|transient|try|var|void|volatile|while|yield|true|false|null'

const JAVA_RE = new RegExp(
  String.raw`(?<comment>\/\*[\s\S]*?\*\/|\/\/[^\n]*)` +
    String.raw`|(?<string>"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')` +
    String.raw`|(?<annotation>@[A-Za-z_$][\w$]*)` +
    String.raw`|(?<keyword>\b(?:${JAVA_KEYWORDS})\b)` +
    String.raw`|(?<number>\b(?:0[xX][0-9a-fA-F_]+|\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?[fFdDlL]?)\b)` +
    String.raw`|(?<constant>\b[A-Z][A-Z0-9_]{1,}\b)` +
    String.raw`|(?<type>\b[A-Z][A-Za-z0-9_$]*\b)`,
  'g',
)

const TS_KEYWORDS =
  'abstract|as|async|await|break|case|catch|class|const|continue|declare|default|delete|do|else|enum|export|extends|false|finally|for|from|function|get|if|implements|import|in|infer|instanceof|interface|keyof|let|new|null|of|readonly|return|satisfies|set|static|super|switch|this|throw|true|try|type|typeof|undefined|unique|unknown|var|void|while|yield'

const TS_RE = new RegExp(
  String.raw`(?<comment>\/\*[\s\S]*?\*\/|\/\/[^\n]*)` +
    String.raw`|(?<string>"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\x60(?:\\.|[^\x60\\])*\x60)` +
    String.raw`|(?<keyword>\b(?:${TS_KEYWORDS})\b)` +
    String.raw`|(?<number>\b(?:0[xX][0-9a-fA-F_]+|\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?n?)\b)` +
    String.raw`|(?<constant>\b[A-Z][A-Z0-9_]{1,}\b)` +
    String.raw`|(?<type>\b[A-Z][A-Za-z0-9_$]*\b)`,
  'g',
)

const SQL_TYPES =
  'BIGINT|BIGSERIAL|BIT|BOOLEAN|CHAR|CLOB|DATE|DATETIME2?|DECIMAL|DOUBLE|FLOAT|INT|INTEGER|JSONB?|NUMBER|NUMERIC|NVARCHAR|REAL|SMALLINT|TEXT|TIMESTAMP|TINYINT|UNIQUEIDENTIFIER|UUID|VARCHAR2?|AUTO_INCREMENT|IDENTITY|GENERATED'

const SQL_KEYWORDS =
  'ADD|AFTER|ALTER|AND|AS|ASC|BEGIN|BETWEEN|BY|CASE|CHARSET|CHECK|COLUMN|COMMENT|CONSTRAINT|CREATE|DEFAULT|DELETE|DESC|DROP|ELSE|END|ENGINE|EXEC|EXECUTE|EXISTS|FROM|GO|GROUP|IF|IN|INDEX|INNER|INSERT|INTO|IS|JOIN|KEY|LEFT|LIKE|LIMIT|NOT|NULL|OBJECT_ID|OFFSET|ON|OR|ORDER|OUTER|PRIMARY|RIGHT|SCHEMA|SELECT|SET|TABLE|THEN|UNIQUE|UPDATE|USE|VALUES|WHEN|WHERE|WITH'

const SQL_RE = new RegExp(
  String.raw`(?<comment>--[^\n]*|\/\*[\s\S]*?\*\/)` +
    `|(?<string>'(?:''|[^'])*'|"(?:[^"]|"")*")` +
    '|(?<identifier>`[^`]*`|\\[[^\\]]*\\])' +
    String.raw`|(?<type>\b(?:${SQL_TYPES})\b)` +
    String.raw`|(?<keyword>\b(?:${SQL_KEYWORDS})\b)` +
    String.raw`|(?<number>\b\d+(?:\.\d+)?\b)`,
  'gi',
)

const JSON_RE = new RegExp(
  String.raw`(?<key>"(?:\\.|[^"\\])*"(?=\s*:))` +
    String.raw`|(?<string>"(?:\\.|[^"\\])*")` +
    String.raw`|(?<boolean>\b(?:true|false|null)\b)` +
    String.raw`|(?<number>-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)`,
  'g',
)

const MARKDOWN_RE =
  /(?<codeblock>^```[\s\S]*?^```\s*$)|(?<heading>^#{1,6} .*$)|(?<quote>^> .*$)|(?<list>^\s*[-*+] )|(?<inlinecode>`[^`\n]+`)|(?<emphasis>\*\*[^*\n]+\*\*)|(?<link>\[[^\]\n]+\]\([^)\n]+\))/gm

const TOKEN_TYPES = new Set<TokenType>([
  'comment',
  'string',
  'annotation',
  'keyword',
  'number',
  'type',
  'constant',
  'key',
  'boolean',
  'identifier',
  'heading',
  'quote',
  'list',
  'inlinecode',
  'emphasis',
  'link',
  'codeblock',
])

function firstGroup(match: RegExpExecArray): TokenType {
  const groups = match.groups ?? {}
  for (const key of Object.keys(groups)) {
    if (groups[key] != null && TOKEN_TYPES.has(key as TokenType)) {
      return key as TokenType
    }
  }
  return 'plain'
}

function tokenizeWith(regex: RegExp, code: string): Token[] {
  if (!code) return []
  regex.lastIndex = 0
  const tokens: Token[] = []
  let lastIndex = 0
  let match = regex.exec(code)
  while (match !== null) {
    if (match[0].length === 0) {
      regex.lastIndex += 1
      match = regex.exec(code)
      continue
    }
    if (match.index > lastIndex) {
      tokens.push({ text: code.slice(lastIndex, match.index), type: 'plain' })
    }
    tokens.push({ text: match[0], type: firstGroup(match) })
    lastIndex = match.index + match[0].length
    match = regex.exec(code)
  }
  if (lastIndex < code.length) {
    tokens.push({ text: code.slice(lastIndex), type: 'plain' })
  }
  return tokens
}

export function tokenize(code: string, language: Language): Token[] {
  switch (language) {
    case 'java':
      return tokenizeWith(JAVA_RE, code)
    case 'typescript':
      return tokenizeWith(TS_RE, code)
    case 'sql':
      return tokenizeWith(SQL_RE, code)
    case 'json':
      return tokenizeWith(JSON_RE, code)
    case 'markdown':
      return tokenizeWith(MARKDOWN_RE, code)
    default:
      return [{ text: code, type: 'plain' }]
  }
}
