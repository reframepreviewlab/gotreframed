/**
 * Canvas image sequence — scroll-driven frame scrubber
 * Reframe Core Reveal: 160 frames
 * On mobile: uses every 2nd frame (80 effective frames)
 */
import { isMobile } from './utils/device.js'
import { loadImage } from './utils/preload.js'

const BASE = import.meta.env.BASE_URL

export class SequencePlayer {
  constructor(canvasEl, opts = {}) {
    this.canvas = canvasEl
    this.ctx = canvasEl.getContext('2d')
    this.totalFrames = opts.totalFrames || 160
    this.step = isMobile() ? 2 : 1  // skip every other frame on mobile
    this.frames = []
    this.currentIndex = -1
    this.loaded = false
    this.loadedCount = 0
    this.onProgress = opts.onProgress || null

    this._resize()
    window.addEventListener('resize', () => this._resize())

    // Start loading
    this._load()
  }

  _framePath(n) {
    const padded = String(n).padStart(4, '0')
    return `${BASE}seq/frame_${padded}.webp`
  }

  async _load() {
    const indices = []
    for (let i = 1; i <= this.totalFrames; i += this.step) {
      indices.push(i)
    }

    // Load frames in batches of 20 for faster initial display
    const batchSize = 20
    this.frames = new Array(indices.length).fill(null)

    for (let b = 0; b < indices.length; b += batchSize) {
      const batch = indices.slice(b, b + batchSize)
      await Promise.all(
        batch.map((frameNum, j) =>
          loadImage(this._framePath(frameNum)).then(img => {
            this.frames[b + j] = img
            this.loadedCount++
            this.onProgress && this.onProgress(this.loadedCount / indices.length)
            // Render first frame as soon as it loads
            if (b + j === 0 && !this.loaded) {
              this.loaded = true
              this.drawFrame(0)
            }
          }).catch(() => {
            // Frame failed — render generated fallback
            this.frames[b + j] = null
            this.loadedCount++
            this.onProgress && this.onProgress(this.loadedCount / indices.length)
          })
        )
      )
    }

    this.loaded = true
  }

  _resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    const w = this.canvas.clientWidth
    const h = this.canvas.clientHeight
    this.canvas.width = w * dpr
    this.canvas.height = h * dpr
    this.ctx.scale(dpr, dpr)
    this._w = w
    this._h = h
    // Re-draw current frame
    if (this.currentIndex >= 0) this.drawFrame(this.currentIndex)
  }

  /**
   * @param {number} progress 0–1
   */
  setProgress(progress) {
    const idx = Math.floor(progress * (this.frames.length - 1))
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
      // Cover fit
      const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight)
      const dw = img.naturalWidth * scale
      const dh = img.naturalHeight * scale
      const dx = (w - dw) / 2
      const dy = (h - dh) / 2
      ctx.drawImage(img, dx, dy, dw, dh)
    } else {
      // Fallback: render generated frame procedurally
      this._drawFallback(idx / Math.max(this.frames.length - 1, 1), ctx, w, h)
    }
  }

  /**
   * Procedural fallback renderer — matches aesthetic of generated frames
   */
  _drawFallback(t, ctx, w, h) {
    const cx = w / 2, cy = h / 2

    // Background
    ctx.fillStyle = '#0B0D10'
    ctx.fillRect(0, 0, w, h)

    // Grid (fades out mid-sequence)
    const gridAlpha = t < 0.4 ? 0.15 : Math.max(0, 0.15 - (t - 0.4) * 0.3)
    if (gridAlpha > 0) {
      ctx.strokeStyle = `rgba(90,82,214,${gridAlpha})`
      ctx.lineWidth = 0.5
      const gSize = 40
      for (let x = 0; x < w; x += gSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
      }
      for (let y = 0; y < h; y += gSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
      }
    }

    // Drifting lines (early frames)
    if (t < 0.5) {
      const lineCount = 12
      const lineAlpha = t < 0.3 ? t / 0.3 : 1 - (t - 0.3) / 0.2
      ctx.strokeStyle = `rgba(90,82,214,${0.3 * lineAlpha})`
      ctx.lineWidth = 1
      for (let i = 0; i < lineCount; i++) {
        const y = (h * (i + 1)) / (lineCount + 1) + Math.sin(t * 4 + i) * 20 * t
        const x0 = w * 0.1 + Math.sin(t * 2 + i * 0.5) * w * 0.1
        const x1 = w * 0.9 + Math.cos(t * 2 + i * 0.3) * w * 0.1
        ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke()
      }
    }

    // Monolith forming (mid frames)
    if (t > 0.25) {
      const cubeProgress = Math.min(1, (t - 0.25) / 0.5)
      const size = 120 * cubeProgress
      const alpha = cubeProgress

      // Glow
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 2)
      grd.addColorStop(0, `rgba(90,82,214,${0.25 * alpha})`)
      grd.addColorStop(1, 'transparent')
      ctx.fillStyle = grd
      ctx.fillRect(cx - size * 2, cy - size * 2, size * 4, size * 4)

      // Cube face
      ctx.strokeStyle = `rgba(90,82,214,${0.8 * alpha})`
      ctx.lineWidth = 1.5
      ctx.strokeRect(cx - size / 2, cy - size / 2, size, size)

      // Inner detail lines
      if (cubeProgress > 0.5) {
        const d = (cubeProgress - 0.5) / 0.5
        ctx.strokeStyle = `rgba(90,82,214,${0.4 * d})`
        ctx.lineWidth = 0.5
        const s3 = size / 3
        for (let i = 1; i < 3; i++) {
          ctx.beginPath()
          ctx.moveTo(cx - size/2 + s3*i, cy - size/2)
          ctx.lineTo(cx - size/2 + s3*i, cy + size/2)
          ctx.stroke()
          ctx.beginPath()
          ctx.moveTo(cx - size/2, cy - size/2 + s3*i)
          ctx.lineTo(cx + size/2, cy - size/2 + s3*i)
          ctx.stroke()
        }
      }
    }

    // Final pulse glow (last frames)
    if (t > 0.8) {
      const pulseT = (t - 0.8) / 0.2
      const pulseAlpha = Math.sin(pulseT * Math.PI * 2) * 0.15 + 0.15
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 200)
      grd.addColorStop(0, `rgba(90,82,214,${pulseAlpha})`)
      grd.addColorStop(1, 'transparent')
      ctx.fillStyle = grd
      ctx.fillRect(0, 0, w, h)
    }
  }
}
