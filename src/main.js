/**
 * Reframe — main entry
 * Orchestrates preloader, GSAP sections, sequence player, Three.js
 */
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  initHeroParallax,
  initStackSection,
  initCorridorParallax,
  initSequenceSection,
  initThreeSection,
  initCTASection,
  refreshAll
} from './gsap-sections.js'
import { SequencePlayer } from './sequence.js'
import { initThreeScene } from './three-scene.js'

gsap.registerPlugin(ScrollTrigger)

const BASE = import.meta.env.BASE_URL

// ============================================================ Noise canvas
function drawNoise(canvas) {
  const ctx = canvas.getContext('2d')
  const w = canvas.width = window.innerWidth
  const h = canvas.height = window.innerHeight
  const imageData = ctx.createImageData(w, h)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const v = Math.random() * 255
    data[i] = data[i + 1] = data[i + 2] = v
    data[i + 3] = 15
  }
  ctx.putImageData(imageData, 0, 0)
}

// ============================================================ Preloader
function updatePreloader(pct) {
  const bar = document.getElementById('preloaderBar')
  const label = document.getElementById('preloaderPct')
  if (bar) bar.style.width = `${Math.round(pct * 100)}%`
  if (label) label.textContent = `${Math.round(pct * 100)}%`
}

function hidePreloader() {
  const el = document.getElementById('preloader')
  if (!el) return
  gsap.to(el, {
    opacity: 0,
    duration: 0.8,
    ease: 'power2.out',
    onComplete: () => el.classList.add('hidden')
  })
}

// ============================================================ Nav scroll
function initNav() {
  ScrollTrigger.create({
    start: '80px top',
    onUpdate: self => {
      document.getElementById('site-nav')?.classList.toggle('scrolled', self.progress > 0)
    }
  })
}

// ============================================================ Contact form
function initContactForm() {
  const form = document.getElementById('contactForm')
  const status = document.getElementById('formStatus')
  if (!form) return

  form.addEventListener('submit', async e => {
    e.preventDefault()
    const btn = form.querySelector('.btn-submit')
    btn.textContent = 'Sending...'
    btn.style.opacity = '0.7'

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      })
      if (res.ok) {
        status.textContent = "✓ Received! We'll be in touch shortly."
        form.reset()
      } else {
        status.textContent = 'Something went wrong. Email us directly at hello@getreframe.co.za'
      }
    } catch {
      status.textContent = 'Network error. Email us at hello@getreframe.co.za'
    }
    btn.textContent = 'Request Access →'
    btn.style.opacity = '1'
  })
}

// ============================================================ Bootstrap
async function bootstrap() {
  // Draw noise texture
  const noiseCanvas = document.getElementById('noiseCanvas')
  if (noiseCanvas) drawNoise(noiseCanvas)

  // Init nav
  initNav()

  // Init contact form
  initContactForm()

  // Init hero parallax (can run before sequence loads)
  initHeroParallax()

  // Init stack
  initStackSection()

  // Init corridor
  initCorridorParallax()

  // Init CTA
  initCTASection()

  // Init Three.js
  const threeCanvas = document.getElementById('threeCanvas')
  const threeWrapper = document.getElementById('threeWrapper')
  let threeScene = null

  if (threeCanvas && threeWrapper) {
    try {
      threeScene = initThreeScene(threeCanvas, threeWrapper)
      initThreeSection(threeScene)
    } catch (err) {
      console.warn('Three.js failed to initialize:', err)
    }
  }

  // Init sequence player with progress callback
  const seqCanvas = document.getElementById('sequenceCanvas')
  if (seqCanvas) {
    const player = new SequencePlayer(seqCanvas, {
      totalFrames: 160,
      onProgress: p => {
        updatePreloader(0.1 + p * 0.9)
        if (p >= 1) {
          setTimeout(hidePreloader, 400)
          refreshAll()
        }
      }
    })

    initSequenceSection(player)

    // Fallback: hide preloader after 6s even if assets slow
    setTimeout(() => {
      hidePreloader()
      refreshAll()
    }, 6000)
  } else {
    // No canvas — hide preloader immediately
    setTimeout(hidePreloader, 800)
  }

  // Initial preloader pulse
  updatePreloader(0.05)

  // Animate pipeline node on stack focus change
  ScrollTrigger.create({
    trigger: '#stackCard1',
    start: 'top 60%',
    onEnter: () => animatePipeline()
  })
}

function animatePipeline() {
  const nodes = document.querySelectorAll('.pipe-node')
  nodes.forEach((node, i) => {
    setTimeout(() => {
      nodes.forEach(n => n.classList.remove('active'))
      node.classList.add('active')
    }, i * 500)
  })
}

// Wait for DOM
document.addEventListener('DOMContentLoaded', bootstrap)
