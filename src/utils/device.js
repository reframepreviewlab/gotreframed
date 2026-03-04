/**
 * Device / capability utilities
 */

export const isMobile = () => window.innerWidth < 768

export const isReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const getPixelRatio = (cap = 2) =>
  Math.min(window.devicePixelRatio || 1, cap)

export const getWebGLPixelRatio = () => getPixelRatio(1.5)

export function onResize(cb, debounceMs = 150) {
  let timer
  const handler = () => {
    clearTimeout(timer)
    timer = setTimeout(cb, debounceMs)
  }
  window.addEventListener('resize', handler)
  return () => window.removeEventListener('resize', handler)
}

export function createIntersectionObserver(element, onEnter, onLeave, threshold = 0.1) {
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) onEnter()
        else onLeave()
      })
    },
    { threshold }
  )
  observer.observe(element)
  return observer
}
