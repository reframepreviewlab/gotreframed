/**
 * GSAP ScrollTrigger sections — defensive version
 */
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

function isMobile() { return window.innerWidth < 768 }
function isReduced() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { return false }
}

export function initHeroParallax() {
  if (isReduced()) return

  // Hero entrance
  gsap.from('.hero-tag', { opacity: 0, y: 20, duration: 0.8, delay: 0.3, ease: 'power2.out' })
  gsap.from('.hero-headline .line', {
    opacity: 0, y: 32, duration: 0.9,
    stagger: 0.13, delay: 0.5, ease: 'power3.out'
  })
  gsap.from('.hero-sub', { opacity: 0, y: 20, duration: 0.8, delay: 0.75, ease: 'power2.out' })
  gsap.from('.hero-actions', { opacity: 0, y: 20, duration: 0.7, delay: 0.95, ease: 'power2.out' })
  gsap.from('.metric', {
    opacity: 0, y: 16, duration: 0.6,
    stagger: 0.1, delay: 1.1, ease: 'power2.out'
  })

  // Parallax on scroll
  gsap.to('.hero-content', {
    opacity: 0, yPercent: -12, ease: 'none',
    scrollTrigger: {
      trigger: '#hero', start: '60% top', end: 'bottom top', scrub: true
    }
  })

  gsap.to('#heroBgLayer', {
    yPercent: isMobile() ? 15 : 30, ease: 'none',
    scrollTrigger: {
      trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true
    }
  })

  document.querySelectorAll('.shape').forEach(shape => {
    const depth = parseFloat(shape.dataset.depth) || 0.3
    gsap.to(shape, {
      yPercent: -60 * depth * (isMobile() ? 0.4 : 1), ease: 'none',
      scrollTrigger: {
        trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true
      }
    })
  })
}

export function initStackSection() {
  const cards = document.querySelectorAll('.stack-card')
  const steps = document.querySelectorAll('.stack-step')
  if (!cards.length || !steps.length) return

  // Set initial card positions
  cards.forEach((card, i) => {
    gsap.set(card, { y: (parseInt(card.dataset.layer) - 1.5) * 20, opacity: 0.5 })
  })

  ScrollTrigger.create({
    trigger: '.stack-sticky-wrapper',
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: self => {
      const stepCount = steps.length
      const idx = Math.min(Math.floor(self.progress * stepCount), stepCount - 1)
      steps.forEach((s, i) => s.classList.toggle('is-active', i === idx))
      updateCards(idx, cards)
    }
  })
}

function updateCards(activeIdx, cards) {
  cards.forEach(card => {
    const layer = parseInt(card.dataset.layer)
    const diff = layer - activeIdx
    gsap.to(card, {
      y: diff * 18,
      opacity: diff === 0 ? 1 : Math.max(0.15, 0.5 - Math.abs(diff) * 0.15),
      scale: diff === 0 ? 1 : 0.98 - Math.abs(diff) * 0.01,
      duration: 0.45, ease: 'power2.out'
    })
    card.classList.toggle('is-focus', diff === 0)
  })
}

export function initCorridorParallax() {
  if (isReduced()) return
  const m = isMobile() ? 0.4 : 1

  ;['#layerFar', '#layerMid', '#layerNear'].forEach((sel, i) => {
    const speeds = [12, 28, 48]
    gsap.to(sel, {
      yPercent: -speeds[i] * m, ease: 'none',
      scrollTrigger: {
        trigger: '#corridor', start: 'top bottom', end: 'bottom top', scrub: true
      }
    })
  })

  gsap.from('.corridor-text', {
    opacity: 0, y: 40,
    scrollTrigger: {
      trigger: '#corridor', start: 'top 70%', end: 'top 30%', scrub: true
    }
  })
}

export function initSequenceSection(player) {
  const seqSection = document.querySelector('.section-sequence')
  if (!seqSection) return

  const seqBar = document.getElementById('seqProgressBar')
  const headline = document.getElementById('seqHeadline')
  const sub = document.getElementById('seqSub')

  const phases = [
    { h: 'Emerging from the noise', s: 'Watch Reframe Core crystallize from raw signal into form.' },
    { h: 'Lines find their purpose', s: 'Every element drawn from chaos, guided by intent.' },
    { h: 'Structure takes shape', s: 'The core geometry resolves — precise, stable, inevitable.' },
    { h: 'Reframe Core is ready', s: 'Your intelligence layer. Versioned, persistent, always on.' }
  ]

  ScrollTrigger.create({
    trigger: seqSection,
    start: 'top top',
    end: 'bottom bottom',
    pin: '.sequence-sticky',
    anticipatePin: 1,
    scrub: 0.5,
    onUpdate: self => {
      player.setProgress(self.progress)
      if (seqBar) seqBar.style.width = `${self.progress * 100}%`
      const idx = Math.min(Math.floor(self.progress * phases.length), phases.length - 1)
      const p = phases[idx]
      if (headline && headline.textContent !== p.h) {
        headline.textContent = p.h
        if (sub) sub.textContent = p.s
      }
    }
  })
}

export function initThreeSection(threeScene) {
  if (!threeScene) return
  ScrollTrigger.create({
    trigger: '#three-section',
    start: 'top bottom', end: 'bottom top',
    scrub: true,
    onUpdate: self => threeScene.setScrollProgress(self.progress)
  })

  gsap.from('.three-copy', {
    opacity: 0, x: 40,
    scrollTrigger: {
      trigger: '.three-copy', start: 'top 80%', end: 'top 40%', scrub: true
    }
  })
}

export function initCTASection() {
  gsap.from('.cta-inner > *', {
    opacity: 0, y: 30, stagger: 0.1,
    scrollTrigger: {
      trigger: '.section-cta', start: 'top 70%', end: 'top 30%', scrub: true
    }
  })
}

export function refreshAll() {
  ScrollTrigger.refresh()
}
