import { createContext, use } from 'react'

const CloseFloatingMenuContext = createContext<() => void>(() => {})

/** Close the nearest hover menu; links outside a flyout receive a no-op. */
export function useCloseFloatingMenu() {
  return use(CloseFloatingMenuContext)
}

export { CloseFloatingMenuContext }
