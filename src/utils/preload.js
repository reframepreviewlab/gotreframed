/**
 * Asset preloader with progress tracking
 */

export function preloadImages(urls, onProgress) {
  let loaded = 0
  const total = urls.length

  if (total === 0) {
    onProgress && onProgress(1)
    return Promise.resolve([])
  }

  return Promise.all(
    urls.map(url =>
      new Promise(resolve => {
        const img = new Image()
        img.onload = img.onerror = () => {
          loaded++
          onProgress && onProgress(loaded / total)
          resolve(img)
        }
        img.src = url
      })
    )
  )
}

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

/**
 * Lazy load: only preload the first N frames immediately,
 * then load the rest in background
 */
export async function preloadSequence(urlFn, total, eager = 20, onProgress) {
  const eagerUrls = Array.from({ length: eager }, (_, i) => urlFn(i + 1))
  const restUrls = Array.from({ length: total - eager }, (_, i) => urlFn(i + eager + 1))

  // Preload eager frames first
  const eagerImgs = await preloadImages(eagerUrls, p => {
    onProgress && onProgress(p * (eager / total))
  })

  // Trigger rest in background
  const allImgs = [...eagerImgs, ...new Array(total - eager).fill(null)]

  // Background load rest
  let bgLoaded = eager
  restUrls.forEach((url, i) => {
    const img = new Image()
    img.onload = img.onerror = () => {
      allImgs[eager + i] = img
      bgLoaded++
      onProgress && onProgress(bgLoaded / total)
    }
    img.src = url
  })

  return allImgs
}
