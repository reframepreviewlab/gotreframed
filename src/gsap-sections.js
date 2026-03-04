/**
 * GSAP ScrollTrigger sections
 * - Hero parallax
 * - Sticky Stack with focus animation
 * - Parallax Corridor
 * - Three.js scroll link
 */
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { isMobile, isReducedMotion } from './utils/device.js'

gsap.registerPlugin(ScrollTrigger)

export function initHeroParallax() {
  const mobile = isMobile()
  const reduced = isReducedMotion()
  if (reduced) return

  // Parallax background layers
  gsap.to('#heroBgLayer', {
    yPercent: 30,
    ease: 'none',
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true
    }
  })

  // Floating shapes parallax
  document.querySelectorAll('.shape').forEach(shape => {
    const depth = parseFloat(shape.dataset.depth) || 0.3
    const speed = mobile ? depth * 0.4 : depth
    gsap.to(shape, {
      yPercent: -60 * speed,
      ease: 'none',
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    })
  })

  // Hero content fade on scroll
  gsap.to('.hero-content', {
    opacity: 0,
    yPercent: -15,
    ease: 'none',
    scrollTrigger: {
      trigger: '#hero',
      start: '60% top',
      end: 'bottom top',
      scrub: true
    }
  })

  // Hero entrance animations
  gsap.from('.hero-tag', { opacity: 0, y: 20, duration: 0.8, delay: 0.2 })
  gsap.from('.hero-headline .line', {
    opacity: 0, y: 30, duration: 0.9,
    stagger: 0.12, delay: 0.4, ease: 'power3.out'
  })
  gsap.from('.hero-sub', { opacity: 0, y: 20, duration: 0.8, delay: 0.7 })
  gsap.from('.hero-actions', { opacity: 0, y: 20, duration: 0.7, delay: 0.9 })
  gsap.from('.hero-metrics .metric', {
    opacity: 0, y: 16, duration: 0.6,
    stagger: 0.1, delay: 1.0
  })
}

export function initStackSection(onStepChange) {
  const cards = document.querySelectorAll('.stack-card')
  const steps = document.querySelectorAll('.stack-step')
  const mobile = isMobile()

  if (mobile) {
    // On mobile, just fade steps in/out as they enter viewport
    steps.forEach(step => {
      ScrollTrigger.create({
        trigger: step,
        start: 'top 70%',
        end: 'bottom 30%',
        onEnter: () => {
          const i = parseInt(step.dataset.step)
          step.classList.add('is-active')
          onStepChange && onStepChange(i)
          updateCards(i, cards)
        },
        onLeave: () => step.classList.remove('is-active'),
        onEnterBack: () => {
          const i = parseInt(step.dataset.step)
          step.classList.add('is-active')
          onStepChange && onStepChange(i)
          updateCards(i, cards)
        },
        onLeaveBack: () => step.classList.remove('is-active')
      })
    })
    return
  }

  // Desktop: pin left panel, scrub through steps
  ScrollTrigger.create({
    trigger: '.stack-sticky-wrapper',
    start: 'top top',
    end: 'bottom bottom',
    pin: false, // sticky is CSS; ST just tracks progress
    onUpdate: self => {
      const stepCount = steps.length
      const stepIdx = Math.floor(self.progress * stepCount)
      const clampedIdx = Math.min(stepIdx, stepCount - 1)
      steps.forEach((s, i) => s.classList.toggle('is-active', i === clampedIdx))
      updateCards(clampedIdx, cards)
      onStepChange && onStepChange(clampedIdx)
    }
  })
}

function updateCards(activeIdx, cards) {
  cards.forEach((card, i) => {
    const layer = parseInt(card.dataset.layer)
    const offset = (layer - activeIdx) * 18
    const isActive = layer === activeIdx

    gsap.to(card, {
      y: offset,
      opacity: isActive ? 1 : 0.4 - Math.abs(layer - activeIdx) * 0.12,
      scale: isActive ? 1 : 0.97 - Math.abs(layer - activeIdx) * 0.01,
      duration: 0.5,
      ease: 'power2.out'
    })

    card.classList.toggle('is-focus', isActive)
  })
}

export function initCorridorParallax() {
  if (isReducedMotion()) return
  const mobile = isMobile()
  const multiplier = mobile ? 0.4 : 1

  gsap.to('#layerFar', {
    yPercent: -15 * multiplier,
    ease: 'none',
    scrollTrigger: { trigger: '#corridor', start: 'top bottom', end: 'bottom top', scrub: true }
  })
  gsap.to('#layerMid', {
    yPercent: -30 * multiplier,
    ease: 'none',
    scrollTrigger: { trigger: '#corridor', start: 'top bottom', end: 'bottom top', scrub: true }
  })
  gsap.to('#layerNear', {
    yPercent: -50 * multiplier,
    ease: 'none',
    scrollTrigger: { trigger: '#corridor', start: 'top bottom', end: 'bottom top', scrub: true }
  })

  gsap.from('.corridor-text', {
    opacity: 0, y: 40,
    scrollTrigger: { trigger: '#corridor', start: 'top 70%', end: 'top 30%', scrub: true }
  })
}

export function initSequenceSection(player) {
  const seqSection = document.querySelector('.section-sequence')
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

      const phaseIdx = Math.floor(self.progress * phases.length)
      const p = phases[Math.min(phaseIdx, phases.length - 1)]
      if (headline && headline.textContent !== p.h) {
        headline.textContent = p.h
        sub.textContent = p.s
      }
    }
  })
}

export function initThreeSection(threeScene) {
  ScrollTrigger.create({
    trigger: '#three-section',
    start: 'top bottom',
    end: 'bottom top',
    scrub: true,
    onUpdate: self => {
      threeScene.setScrollProgress(self.progress)
    }
  })

  gsap.from('.three-copy', {
    opacity: 0, x: 40,
    scrollTrigger: { trigger: '.three-copy', start: 'top 80%', end: 'top 40%', scrub: true }
  })
}

export function initCTASection() {
  gsap.from('.cta-inner > *', {
    opacity: 0, y: 30,
    stagger: 0.1,
    scrollTrigger: { trigger: '.section-cta', start: 'top 70%', end: 'top 30%', scrub: true }
  })
}

export function refreshAll() {
  ScrollTrigger.refresh()
}
