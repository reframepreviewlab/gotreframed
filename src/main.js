/**
 * Reframe — main.js
 * Single file, no complex imports, maximum compatibility
 */
import './styles.css'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import * as THREE from 'three'

gsap.registerPlugin(ScrollTrigger)

const BASE = import.meta.env.BASE_URL

// ─── Noise canvas ──────────────────────────────────────────────────────────
function drawNoise() {
  const canvas = document.getElementById('noiseCanvas')
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  const img = ctx.createImageData(canvas.width, canvas.height)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255
    img.data[i] = img.data[i+1] = img.data[i+2] = v
    img.data[i+3] = 15
  }
  ctx.putImageData(img, 0, 0)
}

// ─── Preloader ─────────────────────────────────────────────────────────────
function setProgress(pct) {
  const bar = document.getElementById('preloaderBar')
  const lbl = document.getElementById('preloaderPct')
  if (bar) bar.style.width = Math.round(pct * 100) + '%'
  if (lbl) lbl.textContent = Math.round(pct * 100) + '%'
}

function hidePreloader() {
  const el = document.getElementById('preloader')
  if (!el || el.classList.contains('hidden')) return
  el.classList.add('hidden')
}

// ─── Hero animations ───────────────────────────────────────────────────────
function initHero() {
  gsap.from('.hero-tag',     { opacity:0, y:20, duration:0.8, delay:0.2 })
  gsap.from('.hero-headline .line', { opacity:0, y:32, duration:0.9, stagger:0.13, delay:0.4 })
  gsap.from('.hero-sub',     { opacity:0, y:20, duration:0.8, delay:0.7 })
  gsap.from('.hero-actions', { opacity:0, y:20, duration:0.7, delay:0.9 })
  gsap.from('.metric',       { opacity:0, y:16, duration:0.6, stagger:0.1, delay:1.05 })

  gsap.to('#heroBgLayer', {
    yPercent: 25, ease:'none',
    scrollTrigger:{ trigger:'#hero', start:'top top', end:'bottom top', scrub:true }
  })
  gsap.to('.hero-content', {
    opacity:0, yPercent:-10, ease:'none',
    scrollTrigger:{ trigger:'#hero', start:'60% top', end:'bottom top', scrub:true }
  })
  document.querySelectorAll('.shape').forEach(s => {
    const d = parseFloat(s.dataset.depth) || 0.3
    gsap.to(s, {
      yPercent: -55 * d, ease:'none',
      scrollTrigger:{ trigger:'#hero', start:'top top', end:'bottom top', scrub:true }
    })
  })
}

// ─── Stack section ─────────────────────────────────────────────────────────
function initStack() {
  const cards = [...document.querySelectorAll('.stack-card')]
  const steps = [...document.querySelectorAll('.stack-step')]
  if (!cards.length) return

  // Show layer 0 as active initially
  activateStep(0, cards, steps)

  ScrollTrigger.create({
    trigger: '.stack-sticky-wrapper',
    start: 'top top',
    end: 'bottom bottom',
    onUpdate(self) {
      const idx = Math.min(Math.floor(self.progress * steps.length), steps.length - 1)
      activateStep(idx, cards, steps)
    }
  })
}

function activateStep(idx, cards, steps) {
  steps.forEach((s, i) => s.classList.toggle('is-active', i === idx))
  cards.forEach(card => {
    const layer = parseInt(card.dataset.layer)
    const diff = layer - idx
    const isActive = diff === 0
    card.classList.toggle('is-active', isActive)
    gsap.to(card, {
      y: diff * 20,
      scale: isActive ? 1 : 1 - Math.abs(diff) * 0.025,
      opacity: isActive ? 1 : Math.max(0.2, 0.55 - Math.abs(diff) * 0.15),
      zIndex: isActive ? 10 : 5 - Math.abs(diff),
      duration: 0.5, ease: 'power2.out',
      overwrite: true
    })
  })
}

// ─── Corridor parallax ─────────────────────────────────────────────────────
function initCorridor() {
  [['#layerFar',12],['#layerMid',28],['#layerNear',50]].forEach(([sel, speed]) => {
    gsap.to(sel, {
      yPercent: -speed, ease:'none',
      scrollTrigger:{ trigger:'#corridor', start:'top bottom', end:'bottom top', scrub:true }
    })
  })
  gsap.from('.corridor-text', {
    opacity:0, y:50,
    scrollTrigger:{ trigger:'#corridor', start:'top 70%', end:'top 30%', scrub:true }
  })
}

// ─── Canvas sequence ───────────────────────────────────────────────────────
function initSequence() {
  const canvas = document.getElementById('sequenceCanvas')
  const section = document.querySelector('.section-sequence')
  if (!canvas || !section) return

  const ctx = canvas.getContext('2d')
  const TOTAL = 160
  const step = window.innerWidth < 768 ? 2 : 1
  const indices = []
  for (let i = 1; i <= TOTAL; i += step) indices.push(i)

  const frames = new Array(indices.length).fill(null)
  let currentIdx = 0
  let loadedCount = 0

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    canvas.width  = canvas.clientWidth  * dpr
    canvas.height = canvas.clientHeight * dpr
    ctx.scale(dpr, dpr)
    drawFrame(currentIdx)
  }

  function drawFrame(idx) {
    currentIdx = idx
    const w = canvas.clientWidth, h = canvas.clientHeight
    const img = frames[idx]
    ctx.clearRect(0, 0, w, h)
    if (img) {
      const s = Math.max(w / img.naturalWidth, h / img.naturalHeight)
      ctx.drawImage(img, (w - img.naturalWidth*s)/2, (h - img.naturalHeight*s)/2, img.naturalWidth*s, img.naturalHeight*s)
    } else {
      drawFallback(idx / Math.max(indices.length-1, 1), ctx, w, h)
    }
  }

  function drawFallback(t, ctx, w, h) {
    const cx = w/2, cy = h/2
    ctx.fillStyle = '#0B0D10'
    ctx.fillRect(0,0,w,h)

    // Grid
    const ga = t < 0.4 ? 0.1 : Math.max(0, 0.1 * (1-(t-0.4)/0.2))
    if (ga > 0.005) {
      ctx.strokeStyle = `rgba(90,82,214,${ga})`
      ctx.lineWidth = 0.5
      for (let x=0;x<w;x+=60){ ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke() }
      for (let y=0;y<h;y+=60){ ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke() }
    }

    // Monolith
    if (t > 0.2) {
      const p = Math.min(1,(t-0.2)/0.55)
      const e = p*p*(3-2*p)
      const mw = 200*e, mh = 340*e
      if (mw > 2) {
        const grd = ctx.createRadialGradient(cx,cy,0,cx,cy,mw*2.5)
        grd.addColorStop(0,`rgba(90,82,214,${0.15*e})`)
        grd.addColorStop(1,'transparent')
        ctx.fillStyle = grd
        ctx.fillRect(cx-mw*2.5, cy-mw*2.5, mw*5, mw*5)
        ctx.fillStyle = `rgba(13,15,22,0.97)`
        ctx.fillRect(cx-mw/2, cy-mh/2, mw, mh)
        ctx.strokeStyle = `rgba(90,82,214,${0.85*e})`
        ctx.lineWidth = 1.5
        ctx.strokeRect(cx-mw/2, cy-mh/2, mw, mh)
        if (e > 0.5) {
          ctx.strokeStyle = `rgba(90,82,214,${0.2*(e-0.5)/0.5})`
          ctx.lineWidth = 0.5
          for (let ci=1;ci<3;ci++){ const x=cx-mw/2+mw*ci/3; ctx.beginPath();ctx.moveTo(x,cy-mh/2);ctx.lineTo(x,cy+mh/2);ctx.stroke() }
          for (let ri=1;ri<5;ri++){ const y=cy-mh/2+mh*ri/5; ctx.beginPath();ctx.moveTo(cx-mw/2,y);ctx.lineTo(cx+mw/2,y);ctx.stroke() }
        }
      }
    }

    // Pulse ring
    if (t > 0.78) {
      const pt = (t-0.78)/0.22
      const r = 180 + Math.sin(pt*Math.PI*3)*14
      ctx.strokeStyle = `rgba(90,82,214,${pt*0.4})`
      ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.stroke()
      ctx.beginPath(); ctx.arc(cx,cy,r*1.35,0,Math.PI*2); ctx.stroke()
    }

    // Vignette
    const vig = ctx.createRadialGradient(cx,cy,0,cx,cy,Math.max(w,h)*0.7)
    vig.addColorStop(0,'rgba(0,0,0,0)')
    vig.addColorStop(1,'rgba(0,0,0,0.5)')
    ctx.fillStyle = vig
    ctx.fillRect(0,0,w,h)
  }

  // Load frames
  function loadFrame(frameNum, idx) {
    const img = new Image()
    img.onload = () => {
      frames[idx] = img
      loadedCount++
      setProgress(0.1 + (loadedCount/indices.length) * 0.9)
      if (loadedCount === indices.length) {
        setTimeout(hidePreloader, 300)
        ScrollTrigger.refresh()
      }
      if (idx === 0) drawFrame(0)
    }
    img.onerror = () => {
      loadedCount++
      setProgress(0.1 + (loadedCount/indices.length) * 0.9)
      if (loadedCount === indices.length) {
        setTimeout(hidePreloader, 300)
        ScrollTrigger.refresh()
      }
    }
    img.src = `${BASE}seq/frame_${String(frameNum).padStart(4,'0')}.webp`
  }

  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
  drawFrame(0)

  // Load eagerly first 30, rest background
  indices.slice(0,30).forEach((n,i) => loadFrame(n,i))
  setTimeout(() => indices.slice(30).forEach((n,i) => loadFrame(n,i+30)), 100)

  const seqBar = document.getElementById('seqProgressBar')
  const headlines = [
    ['Emerging from the noise','Watch Reframe Core crystallize from raw signal into form.'],
    ['Lines find their purpose','Every element drawn from chaos, guided by intent.'],
    ['Structure takes shape','The core geometry resolves — precise, stable, inevitable.'],
    ['Reframe Core is ready','Your intelligence layer. Versioned, persistent, always on.'],
  ]

  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    pin: '.sequence-sticky',
    anticipatePin: 1,
    scrub: 0.8,
    onUpdate(self) {
      const idx = Math.min(Math.floor(self.progress * indices.length), indices.length-1)
      drawFrame(idx)
      if (seqBar) seqBar.style.width = (self.progress*100) + '%'
      const hi = Math.min(Math.floor(self.progress * 4), 3)
      const h2 = document.getElementById('seqHeadline')
      const sub = document.getElementById('seqSub')
      if (h2 && h2.textContent !== headlines[hi][0]) {
        h2.textContent = headlines[hi][0]
        if (sub) sub.textContent = headlines[hi][1]
      }
    }
  })
}

// ─── Three.js ──────────────────────────────────────────────────────────────
function initThree() {
  const canvas = document.getElementById('threeCanvas')
  const wrapper = document.getElementById('threeWrapper')
  if (!canvas || !wrapper) return

  let w = wrapper.clientWidth || window.innerWidth
  let h = wrapper.clientHeight || window.innerHeight

  const renderer = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 1.5))
  renderer.setSize(w, h)
  renderer.setClearColor(0,0)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(55, w/h, 0.1, 100)
  camera.position.set(0, 0, 5)

  const group = new THREE.Group()
  scene.add(group)

  // Core monolith
  const geoBox = new THREE.BoxGeometry(1.2, 2.0, 1.2)
  group.add(new THREE.Mesh(geoBox, new THREE.MeshStandardMaterial({ color:0x0d0f16, metalness:0.85, roughness:0.15 })))
  group.add(new THREE.Mesh(geoBox, new THREE.MeshBasicMaterial({ color:0x5A52D6, wireframe:true, transparent:true, opacity:0.3 })))

  // Rings
  const rGeo = new THREE.TorusGeometry(1.85, 0.012, 6, 80)
  const ring1 = new THREE.Mesh(rGeo, new THREE.MeshBasicMaterial({ color:0x5A52D6, transparent:true, opacity:0.55 }))
  ring1.rotation.x = Math.PI/2
  group.add(ring1)

  const ring2 = new THREE.Mesh(rGeo.clone(), new THREE.MeshBasicMaterial({ color:0x8B7FFF, transparent:true, opacity:0.28 }))
  ring2.rotation.set(Math.PI/3, 0, Math.PI/6)
  group.add(ring2)

  // Particles
  const pCount = window.innerWidth < 768 ? 60 : 140
  const pPos = new Float32Array(pCount * 3)
  for (let i=0;i<pCount*3;i++) pPos[i] = (Math.random()-0.5)*9
  const pGeo = new THREE.BufferGeometry()
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos,3))
  scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({ color:0x5A52D6, size:0.022, transparent:true, opacity:0.65 })))

  // Lights
  scene.add(new THREE.AmbientLight(0x1a1a2e, 2.5))
  const pl = new THREE.PointLight(0x5A52D6, 5, 9); pl.position.set(2,2,2); scene.add(pl)
  const pl2 = new THREE.PointLight(0x8B7FFF, 2.5, 7); pl2.position.set(-2,-1,1); scene.add(pl2)

  let isVisible = false, raf = null, time = 0, scrollProg = 0
  let mouse = {x:0,y:0}, target = {x:0,y:0}

  new IntersectionObserver(entries => {
    isVisible = entries[0].isIntersecting
    isVisible ? startLoop() : stopLoop()
  }, { threshold:0.05 }).observe(wrapper)

  window.addEventListener('mousemove', e => {
    target.x = (e.clientX/window.innerWidth - 0.5) * 2
    target.y = -(e.clientY/window.innerHeight - 0.5) * 2
  })

  window.addEventListener('resize', () => {
    w = wrapper.clientWidth; h = wrapper.clientHeight
    camera.aspect = w/h; camera.updateProjectionMatrix()
    renderer.setSize(w,h)
  })

  function loop() {
    if (!isVisible) return
    raf = requestAnimationFrame(loop)
    time += 0.008
    mouse.x += (target.x-mouse.x)*0.05
    mouse.y += (target.y-mouse.y)*0.05
    group.rotation.y = scrollProg * Math.PI*2 + time*0.28
    group.rotation.x = scrollProg * 0.4 + Math.sin(time)*0.04
    group.position.x = mouse.x*0.3
    group.position.y = mouse.y*0.2
    ring1.rotation.y += 0.005
    ring2.rotation.z += 0.003
    ring1.material.opacity = 0.45 + Math.sin(time*1.4)*0.1
    camera.position.z = 5 - scrollProg*1.5
    renderer.render(scene, camera)
  }
  function startLoop() { if (!raf) loop() }
  function stopLoop() { if (raf){ cancelAnimationFrame(raf); raf=null } }

  ScrollTrigger.create({
    trigger: '#three-section', start:'top bottom', end:'bottom top', scrub:true,
    onUpdate(s){ scrollProg = s.progress }
  })
  gsap.from('.three-copy', {
    opacity:0, x:50,
    scrollTrigger:{ trigger:'.three-copy', start:'top 80%', end:'top 40%', scrub:true }
  })
}

// ─── CTA section ───────────────────────────────────────────────────────────
function initCTA() {
  gsap.from('.cta-inner > *', {
    opacity:0, y:30, stagger:0.1,
    scrollTrigger:{ trigger:'.section-cta', start:'top 70%', end:'top 30%', scrub:true }
  })
}

// ─── Contact form ──────────────────────────────────────────────────────────
function initForm() {
  const form = document.getElementById('contactForm')
  const status = document.getElementById('formStatus')
  if (!form) return
  form.addEventListener('submit', async e => {
    e.preventDefault()
    const btn = form.querySelector('.btn-submit')
    btn.textContent = 'Sending...'
    btn.style.opacity = '0.7'
    try {
      const res = await fetch(form.action, { method:'POST', body:new FormData(form), headers:{Accept:'application/json'} })
      status.textContent = res.ok ? 'Received! We will be in touch.' : 'Something went wrong. Email hello@getreframe.co.za'
      if (res.ok) form.reset()
    } catch { status.textContent = 'Network error. Email hello@getreframe.co.za' }
    btn.textContent = 'Request Access'
    btn.style.opacity = '1'
  })
}

// ─── Boot ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  drawNoise()
  initHero()
  initStack()
  initCorridor()
  initSequence()
  initThree()
  initCTA()
  initForm()

  // Fallback: always hide preloader after 5s
  setTimeout(hidePreloader, 5000)

  // Pipeline animation on scroll
  ScrollTrigger.create({
    trigger: '#stackCard1', start: 'top 70%',
    once: true,
    onEnter() {
      const nodes = document.querySelectorAll('.pipe-node')
      nodes.forEach((n, i) => setTimeout(() => {
        nodes.forEach(x => x.classList.remove('active'))
        n.classList.add('active')
      }, i * 600))
    }
  })
})
