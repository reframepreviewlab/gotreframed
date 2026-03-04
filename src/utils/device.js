export const isMobile = () => window.innerWidth < 768
export const isReducedMotion = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { return false }
}
export const getPixelRatio = (cap = 2) => Math.min(window.devicePixelRatio || 1, cap)
export const getWebGLPixelRatio = () => getPixelRatio(1.5)
