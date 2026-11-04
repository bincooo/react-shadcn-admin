/** 删除目标：单个删除带人名，批量删除只带 id 集合 */
export interface DeleteTarget {
  ids: string[]
  /** 单个删除时的人名（昵称/账号），用于确认文案；批量删除不传 */
  name?: string
}

/** 删除目标的确认文案（单个显示人名，批量显示数量） */
/** 删除确认文案：单个带用户名，批量带数量；由调用方传入 t 以复用同一条文案链 */
export function describeDeleteTarget(
  target: DeleteTarget,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  if (target.ids.length === 1) {
    return t('system.user.deleteOne', { name: target.name ?? target.ids[0] })
  }
  return t('system.user.deleteMany', { count: target.ids.length })
}
