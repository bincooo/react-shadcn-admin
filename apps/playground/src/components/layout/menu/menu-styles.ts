/** 按层级计算左内边距：每深一级缩进 18px（1 级 = 12px 基准） */
export function indent(depth: number) {
  return { paddingLeft: `${12 + depth * 18}px` }
}
