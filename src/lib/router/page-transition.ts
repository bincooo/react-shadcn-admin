/**
 * 抽屉发起导航时跳过页面入场动画。
 *
 * 移动端点击菜单项会同时触发两套动画：抽屉退场（淡出 300ms）与路由切换后的
 * `.page-enter` 入场（opacity 0 → 1，且要等懒加载 chunk 到位才开始）。
 * 两者叠加时，抽屉已淡出而新页面还在 opacity 0，屏幕上会出现一段空白。
 * 抽屉导航本身已经提供了转场，这里记录目标路径、让该次挂载不带入场动画。
 *
 * 用模块级变量而非 store：读取发生在渲染期，若通过 state 清除会引发重渲染，
 * 反而给已经挂载的元素补上 `.page-enter` 并重新播放动画。
 */
let target: string | null = null
let timer: ReturnType<typeof setTimeout> | undefined

/** 标记「导航到 `pathname` 来自移动端抽屉」；超时自动失效，避免误伤后续切换 */
export function markDrawerNavigation(pathname: string) {
  target = pathname
  clearTimeout(timer)
  timer = setTimeout(() => {
    target = null
  }, 600)
}

/**
 * 该路径的挂载是否由抽屉发起。
 * 只读不清除：渲染期调用必须幂等（严格模式会重复渲染）；
 * 清理由路由真正切换后的 `clearDrawerNavigation` 负责。
 */
export function isDrawerNavigation(pathname: string) {
  return target === pathname
}

/** 路由已切换到目标路径，标记可以撤下 */
export function clearDrawerNavigation() {
  target = null
  clearTimeout(timer)
}
