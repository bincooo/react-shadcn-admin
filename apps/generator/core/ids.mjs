/** 生成稳定唯一 ID；浏览器与 Node 共用。 */
export function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `def_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}
