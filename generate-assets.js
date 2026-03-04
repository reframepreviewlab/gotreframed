/**
 * Asset Generator for Reframe Scrollytelling
 * Run: node generate-assets.js
 *
 * Generates:
 *   - public/seq/frame_0001.webp ... frame_0160.webp (canvas sequence)
 *   - public/img/bg/noise.png
 *   - public/img/shapes/shape-01.png ... shape-12.png
 *
 * Requirements: npm install canvas sharp
 */

const { createCanvas, loadImage } = require('canvas')
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const OUT_SEQ = path.join(__dirname, 'public/seq')
const OUT_SHAPES = path.join(__dirname, 'public/img/shapes')
const OUT_BG = path.join(__dirname, 'public/img/bg')

;[OUT_SEQ, OUT_SHAPES, OUT_BG].forEach(d => fs.mkdirSync(d, { recursive: true }))

const W = 1440, H = 900
const TOTAL = 160
const ACCENT = { r: 90, g: 82, b: 214 }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function lerp(a, b, t) { return a + (b - a) * t }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }
function ease(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t }

// ─── Sequence frames ─────────────────────────────────────────────────────────

async function generateFrame(idx) {
  const t = idx / (TOTAL - 1)
  const canvas = createCanvas(W, H)
  const ctx = canvas.getContext('2d')
  const cx = W / 2, cy = H / 2

  // ── Background
  ctx.fillStyle = '#0B0D10'
  ctx.fillRect(0, 0, W, H)

  // ── Phase 1 (t 0–0.35): Grid + drifting lines
  {
    const gridAlpha = t < 0.3
      ? clamp(t / 0.05, 0, 1) * 0.12
      : clamp(1 - (t - 0.3) / 0.15, 0, 1) * 0.12

    if (gridAlpha > 0.002) {
      ctx.strokeStyle = `rgba(${ACCENT.r},${ACCENT.g},${ACCENT.b},${gridAlpha})`
      ctx.lineWidth = 0.5
      const gs = 60
      for (let x = 0; x <= W; x += gs) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
      }
      for (let y = 0; y <= H; y += gs) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
      }
    }

    // Horizontal flowing lines
    const lineAmt = t < 0.15 ? t / 0.15 : clamp(1 - (t - 0.15) / 0.3, 0, 1)
    if (lineAmt > 0.01) {
      const count = 16
      for (let i = 0; i < count; i++) {
        const phase = i / count
        const y = lerp(H * 0.15, H * 0.85, phase)
        const wave = Math.sin(t * 8 + phase * Math.PI * 2) * lerp(80, 0, t / 0.45)
        const a = lineAmt * 0.25 * Math.sin(phase * Math.PI)
        ctx.strokeStyle = `rgba(${ACCENT.r},${ACCENT.g},${ACCENT.b},${a})`
        ctx.lineWidth = 1

        ctx.beginPath()
        for (let x = 0; x <= W; x += 4) {
          const wy = y + Math.sin(x / W * Math.PI * 3 + t * 4 + phase * 2) * wave
          x === 0 ? ctx.moveTo(x, wy) : ctx.lineTo(x, wy)
        }
        ctx.stroke()
      }
    }
  }

  // ── Phase 2 (t 0.2–0.75): Lines converge → monolith forms
  {
    const formT = clamp((t - 0.2) / 0.55, 0, 1)
    const formE = ease(formT)

    // Gathering particle lines
    if (formT > 0 && formT < 0.85) {
      const particleAlpha = formT < 0.5 ? formT / 0.5 : clamp(1 - (formT - 0.5) / 0.35, 0, 1)
      const rays = 24
      for (let r = 0; r < rays; r++) {
        const angle = (r / rays) * Math.PI * 2 + t * 0.5
        const dist = lerp(W * 0.6, 40, formE)
        const x0 = cx + Math.cos(angle) * dist
        const y0 = cy + Math.sin(angle) * dist * 0.6
        const x1 = cx + Math.cos(angle) * dist * 0.6
        const y1 = cy + Math.sin(angle) * dist * 0.35

        const grad = ctx.createLinearGradient(x0, y0, x1, y1)
        grad.addColorStop(0, `rgba(${ACCENT.r},${ACCENT.g},${ACCENT.b},0)`)
        grad.addColorStop(1, `rgba(${ACCENT.r},${ACCENT.g},${ACCENT.b},${0.25 * particleAlpha})`)
        ctx.strokeStyle = grad
        ctx.lineWidth = 0.8
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke()
      }
    }

    // Monolith geometry
    const cubeAlpha = clamp((formT - 0.2) / 0.4, 0, 1)
    if (cubeAlpha > 0.01) {
      const mW = lerp(0, 200, ease(clamp((formT - 0.2) / 0.5, 0, 1)))
      const mH = lerp(0, 340, ease(clamp((formT - 0.15) / 0.55, 0, 1)))
      const mx = cx - mW / 2
      const my = cy - mH / 2

      // Glow behind monolith
      const glowR = mW * 2.5
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR)
      grd.addColorStop(0, `rgba(${ACCENT.r},${ACCENT.g},${ACCENT.b},${0.12 * cubeAlpha})`)
      grd.addColorStop(0.5, `rgba(${ACCENT.r},${ACCENT.g},${ACCENT.b},${0.05 * cubeAlpha})`)
      grd.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = grd
      ctx.fillRect(cx - glowR, cy - glowR, glowR * 2, glowR * 2)

      // Face fill
      ctx.fillStyle = `rgba(13,15,22,${0.95 * cubeAlpha})`
      ctx.fillRect(mx, my, mW, mH)

      // Border
      ctx.strokeStyle = `rgba(${ACCENT.r},${ACCENT.g},${ACCENT.b},${0.85 * cubeAlpha})`
      ctx.lineWidth = 1.5
      ctx.strokeRect(mx, my, mW, mH)

      // Interior grid lines
      if (cubeAlpha > 0.5) {
        const gridA = (cubeAlpha - 0.5) / 0.5
        ctx.strokeStyle = `rgba(${ACCENT.r},${ACCENT.g},${ACCENT.b},${0.18 * gridA})`
        ctx.lineWidth = 0.5
        const cols = 3, rows = 5
        for (let c = 1; c < cols; c++) {
          const x = mx + (mW / cols) * c
          ctx.beginPath(); ctx.moveTo(x, my); ctx.lineTo(x, my + mH); ctx.stroke()
        }
        for (let r = 1; r < rows; r++) {
          const y = my + (mH / rows) * r
          ctx.beginPath(); ctx.moveTo(mx, y); ctx.lineTo(mx + mW, y); ctx.stroke()
        }
      }

      // Isometric top face suggestion
      if (cubeAlpha > 0.7) {
        const isoA = (cubeAlpha - 0.7) / 0.3
        const depth = mW * 0.28 * isoA
        ctx.strokeStyle = `rgba(${ACCENT.r},${ACCENT.g},${ACCENT.b},${0.55 * isoA})`
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.moveTo(mx, my)
        ctx.lineTo(mx + depth, my - depth * 0.5)
        ctx.lineTo(mx + mW + depth, my - depth * 0.5)
        ctx.lineTo(mx + mW, my)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(mx + mW, my)
        ctx.lineTo(mx + mW + depth, my - depth * 0.5)
        ctx.stroke()

        ctx.fillStyle = `rgba(13,15,22,${0.6 * isoA})`
        ctx.beginPath()
        ctx.moveTo(mx, my)
        ctx.lineTo(mx + depth, my - depth * 0.5)
        ctx.lineTo(mx + mW + depth, my - depth * 0.5)
        ctx.lineTo(mx + mW, my)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
      }
    }
  }

  // ── Phase 3 (t 0.8–1.0): Crisp reveal + lavender pulse
  {
    const pulseT = clamp((t - 0.78) / 0.22, 0, 1)
    if (pulseT > 0) {
      // Outer ring pulse
      const ringRadius = 180 + Math.sin(pulseT * Math.PI * 3) * 15
      const ringAlpha = pulseT * 0.4
      ctx.strokeStyle = `rgba(${ACCENT.r},${ACCENT.g},${ACCENT.b},${ringAlpha})`
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2)
      ctx.stroke()

      // Second ring
      ctx.strokeStyle = `rgba(${ACCENT.r},${ACCENT.g},${ACCENT.b},${ringAlpha * 0.4})`
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.arc(cx, cy, ringRadius * 1.4, 0, Math.PI * 2)
      ctx.stroke()

      // Pulse glow overlay
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 280)
      const pa = Math.sin(pulseT * Math.PI) * 0.15
      grd.addColorStop(0, `rgba(${ACCENT.r},${ACCENT.g},${ACCENT.b},${pa})`)
      grd.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = grd
      ctx.fillRect(cx - 280, cy - 280, 560, 560)

      // Scan line effect
      const scanA = pulseT * 0.06
      const scanY = cy + Math.sin(pulseT * Math.PI * 6) * 50
      ctx.fillStyle = `rgba(${ACCENT.r},${ACCENT.g},${ACCENT.b},${scanA})`
      ctx.fillRect(0, scanY, W, 2)
    }
  }

  // ── Subtle vignette
  const vig = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.7)
  vig.addColorStop(0, 'rgba(0,0,0,0)')
  vig.addColorStop(1, 'rgba(0,0,0,0.45)')
  ctx.fillStyle = vig
  ctx.fillRect(0, 0, W, H)

  // ── Export as WebP
  const buffer = canvas.toBuffer('image/png')
  const num = String(idx + 1).padStart(4, '0')
  const outPath = path.join(OUT_SEQ, `frame_${num}.webp`)
  await sharp(buffer).webp({ quality: 80 }).toFile(outPath)
  if ((idx + 1) % 20 === 0) console.log(`  Frames: ${idx + 1}/${TOTAL}`)
}

// ─── Background noise PNG ─────────────────────────────────────────────────────

async function generateNoise() {
  const size = 256
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')
  const img = ctx.createImageData(size, size)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v
    img.data[i + 3] = 18
  }
  ctx.putImageData(img, 0, 0)
  const buf = canvas.toBuffer('image/png')
  await sharp(buf).png().toFile(path.join(OUT_BG, 'noise.png'))
  console.log('  noise.png done')
}

// ─── Shapes ──────────────────────────────────────────────────────────────────

async function generateShape(idx) {
  const size = 300
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, size, size)
  const cx = size / 2, cy = size / 2

  const shapes = [
    // 0: large soft orb
    () => {
      const grd = ctx.createRadialGradient(cx * 0.8, cy * 0.8, 0, cx, cy, 110)
      grd.addColorStop(0, 'rgba(90,82,214,0.6)')
      grd.addColorStop(0.5, 'rgba(90,82,214,0.2)')
      grd.addColorStop(1, 'rgba(90,82,214,0)')
      ctx.fillStyle = grd
      ctx.beginPath(); ctx.arc(cx, cy, 110, 0, Math.PI * 2); ctx.fill()
    },
    // 1: small crisp orb
    () => {
      const grd = ctx.createRadialGradient(cx * 0.7, cy * 0.7, 0, cx, cy, 60)
      grd.addColorStop(0, 'rgba(139,127,255,0.7)')
      grd.addColorStop(1, 'rgba(90,82,214,0)')
      ctx.fillStyle = grd
      ctx.beginPath(); ctx.arc(cx, cy, 60, 0, Math.PI * 2); ctx.fill()
    },
    // 2: diamond
    () => {
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.PI / 4)
      const grd = ctx.createLinearGradient(-50, -50, 50, 50)
      grd.addColorStop(0, 'rgba(139,127,255,0.5)')
      grd.addColorStop(1, 'rgba(90,82,214,0.15)')
      ctx.fillStyle = grd
      ctx.strokeStyle = 'rgba(90,82,214,0.6)'; ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.rect(-50, -50, 100, 100)
      ctx.fill(); ctx.stroke(); ctx.restore()
    },
    // 3: ring
    () => {
      ctx.strokeStyle = 'rgba(90,82,214,0.5)'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.arc(cx, cy, 80, 0, Math.PI * 2); ctx.stroke()
      ctx.strokeStyle = 'rgba(90,82,214,0.2)'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.arc(cx, cy, 90, 0, Math.PI * 2); ctx.stroke()
    },
    // 4: organic blob
    () => {
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 90)
      grd.addColorStop(0, 'rgba(90,82,214,0.35)')
      grd.addColorStop(1, 'rgba(90,82,214,0)')
      ctx.fillStyle = grd
      ctx.beginPath()
      ctx.ellipse(cx, cy, 90, 70, Math.PI / 5, 0, Math.PI * 2)
      ctx.fill()
    },
    // 5: small square
    () => {
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.PI / 8)
      ctx.fillStyle = 'rgba(90,82,214,0.4)'
      ctx.strokeStyle = 'rgba(139,127,255,0.6)'; ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.rect(-30, -30, 60, 60)
      ctx.fill(); ctx.stroke(); ctx.restore()
    },
    // 6: triangle-ish
    () => {
      const grd = ctx.createLinearGradient(cx, cy - 80, cx, cy + 80)
      grd.addColorStop(0, 'rgba(139,127,255,0.45)')
      grd.addColorStop(1, 'rgba(90,82,214,0.1)')
      ctx.fillStyle = grd
      ctx.beginPath()
      ctx.moveTo(cx, cy - 80); ctx.lineTo(cx + 70, cy + 50); ctx.lineTo(cx - 70, cy + 50)
      ctx.closePath(); ctx.fill()
    },
    // 7: double ring
    () => {
      [60, 80, 100].forEach((r, i) => {
        ctx.strokeStyle = `rgba(90,82,214,${0.4 - i * 0.12})`; ctx.lineWidth = 1
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke()
      })
    },
    // 8: cross
    () => {
      ctx.strokeStyle = 'rgba(90,82,214,0.45)'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(cx - 60, cy); ctx.lineTo(cx + 60, cy); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx, cy - 60); ctx.lineTo(cx, cy + 60); ctx.stroke()
    },
    // 9: hexagon outline
    () => {
      ctx.strokeStyle = 'rgba(90,82,214,0.5)'; ctx.lineWidth = 1.5
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6
        i === 0 ? ctx.moveTo(cx + 70 * Math.cos(a), cy + 70 * Math.sin(a))
                : ctx.lineTo(cx + 70 * Math.cos(a), cy + 70 * Math.sin(a))
      }
      ctx.closePath(); ctx.stroke()
    },
    // 10: dot cluster
    () => {
      for (let i = 0; i < 7; i++) {
        const a = (Math.PI * 2 / 7) * i
        const r = 65, dot = 8 - i * 0.4
        ctx.fillStyle = `rgba(90,82,214,${0.6 - i * 0.05})`
        ctx.beginPath()
        ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, dot, 0, Math.PI * 2)
        ctx.fill()
      }
    },
    // 11: gradient arc
    () => {
      ctx.strokeStyle = 'rgba(90,82,214,0.55)'; ctx.lineWidth = 3
      ctx.beginPath(); ctx.arc(cx, cy, 75, 0, Math.PI * 1.5); ctx.stroke()
      ctx.strokeStyle = 'rgba(139,127,255,0.25)'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.arc(cx, cy, 90, 0.3, Math.PI * 1.2); ctx.stroke()
    }
  ]

  shapes[idx % shapes.length]()

  const buf = canvas.toBuffer('image/png')
  const num = String(idx + 1).padStart(2, '0')
  await sharp(buf).png().toFile(path.join(OUT_SHAPES, `shape-${num}.png`))
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Generating noise texture...')
  await generateNoise()

  console.log('Generating 12 shapes...')
  for (let i = 0; i < 12; i++) await generateShape(i)
  console.log('  Shapes done')

  console.log(`Generating ${TOTAL} sequence frames (this may take 2–4 min)...`)
  // Process in parallel batches of 8
  const batchSize = 8
  for (let b = 0; b < TOTAL; b += batchSize) {
    const batch = Array.from({ length: Math.min(batchSize, TOTAL - b) }, (_, j) => b + j)
    await Promise.all(batch.map(generateFrame))
  }

  console.log('\n✓ All assets generated!')
  console.log(`  Sequence: ${OUT_SEQ}`)
  console.log(`  Shapes:   ${OUT_SHAPES}`)
  console.log(`  BG:       ${OUT_BG}`)
}

main().catch(console.error)
