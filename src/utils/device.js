export const isMobile = () => window.innerWidth < 768
export const isReducedMotion = () => false
export const getPixelRatio = (cap=2) => Math.min(window.devicePixelRatio||1,cap)
export const getWebGLPixelRatio = () => Math.min(window.devicePixelRatio||1,1.5)
