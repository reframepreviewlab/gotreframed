/**
 * Canvas sequence player — defensive version
 */

const BASE = import.meta.env.BASE_URL

function isMobile() { return window.innerWidth < 768 }

export class SequencePlayer {
  constructor(canvasEl, opts = {}) {
    this.canvas = canvasEl
    this.ctx = canvasEl.getContext('2d')
    this.totalFrames = opts.totalFrames || 160
    this.step = isMobile() ? 2 : 1
    this.frames = []
    this.currentIndex = -1
    this.onProgress = opts.onProgress || null
    this._w = canvasEl.clientWidth || 800
    this._h = canvasEl.clientHeight || 600

    this._resize()
    window.addEventListener('resize', () => this._resize())
    this._load()
  }

  _framePath(n) {
    return `${BASE}seq/frame_${String(n).padStart(4, '0')}.webp`
  }

  async _load() {
    const indices = []
    for (let i = 1; i <= this.totalFrames; i += this.step) indices.push(i)
    const total = indices.length
    let loaded = 0

    this.frames = new Array(total).fill(null)

    // Draw fallback immediately
    this.drawFrame(0)

    const loadOne = (frameNum, idx) => new Promise(resolve => {
      const img = new Image()
      img.onload = () => {
        this.frames[idx] = img
        loaded++
        this.onProgress && this.onProgress(loaded / total)
        if (idx === 0) this.drawFrame(0)
        resolve()
      }
      img.onerror = () => {
        loaded++
        this.onProgress && this.onProgress(loaded / total)
        resolve()
      }
      img.src = this._framePath(frameNum)
    })

    // Load first 20 eagerly, rest in background
    const eager = indices.slice(0, 20)
    const rest = indices.slice(20)

    await Promise.all(eager.map((n, i) => loadOne(n, i)))

    // Background load rest
    rest.forEach((n, i) => loadOne(n, 20 + i))
  }

  _resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    const w = this.canvas.clientWidth || 800
    const h = this.canvas.clientHeight || 600
    this.canvas.width = w * dpr
    this.canvas.height = h * dpr
    this.ctx.scale(dpr, dpr)
    this._w = w
    this._h = h
    if (this.currentIndex >= 0) this.drawFrame(this.currentIndex)
  }

  setProgress(progress) {
    const idx = Math.min(
      Math.floor(progress * (this.frames.length - 1)),
      this.frames.length - 1
    )
    if (idx !== this.currentIndex) {
      this.currentIndex = idx
      this.drawFrame(idx)
    }
  }

  drawFrame(idx) {
    const img = this.frames[idx]
    const ctx = this.ctx
    const w = this._w, h = this._h
    ctx.clearRect(0, 0, w, h)

    if (img) {
      const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight)
      const dw = img.naturalWidth * scale
      const dh = img.naturalHeight * scale
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh)
    } else {
      this._drawFallback(idx / Math.max(this.frames.length - 1, 1), ctx, w, h)
    }
  }

  _drawFallback(t, ctx, w, h) {
    const cx = w / 2, cy = h / 2
    ctx.fillStyle = '#0B0D10'
    ctx.fillRect(0, 0, w, h)

    // Grid
    const ga = t < 0.4 ? 0.12 : Math.max(0, 0.12 - (t - 0.4) * 0.3)
    if (ga > 0.01) {
      ctx.strokeStyle = `rgba(90,82,214,${ga})`
      ctx.lineWidth = 0.5
      for (let x = 0; x < w; x += 60) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke() }
      for (let y = 0; y < h; y += 60) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke() }
    }

    // Monolith
    if (t > 0.25) {
      const p = Math.min(1, (t - 0.25) / 0.5)
      const ease = p * p * (3 - 2 * p)
      const mw = 200 * ease, mh = 340 * ease
      const mx = cx - mw / 2, my = cy - mh / 2

      // Glow
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, mw * 2.5)
      grd.addColorStop(0, `rgba(90,82,214,${0.15 * ease})`)
      grd.addColorStop(1, 'transparent')
      ctx.fillStyle = grd
      ctx.fillRect(cx - mw * 2.5, cy - mw * 2.5, mw * 5, mw * 5)

      ctx.fillStyle = `rgba(13,15,22,${0.96 * ease})`
      ctx.fillRect(mx, my, mw, mh)
      ctx.strokeStyle = `rgba(90,82,214,${0.85 * ease})`
      ctx.lineWidth = 1.5
      ctx.strokeRect(mx, my, mw, mh)
    }

    // Pulse
    if (t > 0.8) {
      const pt = (t - 0.8) / 0.2
      const r = 180 + Math.sin(pt * Math.PI * 3) * 14
      ctx.strokeStyle = `rgba(90,82,214,${pt * 0.4})`
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke()
    }
  }
}
