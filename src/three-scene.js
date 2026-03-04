/**
 * Three.js ambient section
 * Scroll-linked rotation, mouse parallax (desktop only)
 * Pauses when off-screen via IntersectionObserver
 */
import * as THREE from 'three'
import { getWebGLPixelRatio, isMobile, createIntersectionObserver } from './utils/device.js'

export function initThreeScene(canvasEl, wrapperEl) {
  // ---- Setup ----
  const renderer = new THREE.WebGLRenderer({
    canvas: canvasEl,
    alpha: true,
    antialias: !isMobile()
  })
  renderer.setPixelRatio(getWebGLPixelRatio())
  renderer.setSize(canvasEl.clientWidth, canvasEl.clientHeight)
  renderer.setClearColor(0x000000, 0)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(
    55,
    canvasEl.clientWidth / canvasEl.clientHeight,
    0.1, 100
  )
  camera.position.set(0, 0, 5)

  // ---- Geometry: Low-poly Core ----
  const group = new THREE.Group()
  scene.add(group)

  // Central monolith (tall box)
  const monolithGeo = new THREE.BoxGeometry(1.2, 2.0, 1.2)
  const monolithMat = new THREE.MeshStandardMaterial({
    color: 0x0d0f16,
    metalness: 0.8,
    roughness: 0.2,
    wireframe: false
  })
  const monolith = new THREE.Mesh(monolithGeo, monolithMat)
  group.add(monolith)

  // Wireframe overlay
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0x5A52D6,
    wireframe: true,
    transparent: true,
    opacity: 0.35
  })
  const wireframe = new THREE.Mesh(monolithGeo, wireMat)
  group.add(wireframe)

  // Outer ring
  const ringGeo = new THREE.TorusGeometry(1.8, 0.015, 6, 80)
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x5A52D6, transparent: true, opacity: 0.5
  })
  const ring = new THREE.Mesh(ringGeo, ringMat)
  ring.rotation.x = Math.PI / 2
  group.add(ring)

  // Second ring (tilted)
  const ring2 = new THREE.Mesh(ringGeo.clone(), new THREE.MeshBasicMaterial({
    color: 0x8B7FFF, transparent: true, opacity: 0.25
  }))
  ring2.rotation.set(Math.PI / 3, 0, Math.PI / 6)
  group.add(ring2)

  // Floating particles
  const particleGeo = new THREE.BufferGeometry()
  const pCount = isMobile() ? 60 : 120
  const pPositions = new Float32Array(pCount * 3)
  for (let i = 0; i < pCount; i++) {
    pPositions[i * 3] = (Math.random() - 0.5) * 8
    pPositions[i * 3 + 1] = (Math.random() - 0.5) * 8
    pPositions[i * 3 + 2] = (Math.random() - 0.5) * 6
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3))
  const particleMat = new THREE.PointsMaterial({
    color: 0x5A52D6, size: 0.025,
    transparent: true, opacity: 0.6, sizeAttenuation: true
  })
  const particles = new THREE.Points(particleGeo, particleMat)
  scene.add(particles)

  // ---- Lighting ----
  const ambient = new THREE.AmbientLight(0x1a1a2e, 2)
  scene.add(ambient)

  const pointLight = new THREE.PointLight(0x5A52D6, 4, 8)
  pointLight.position.set(2, 2, 2)
  scene.add(pointLight)

  const pointLight2 = new THREE.PointLight(0x8B7FFF, 2, 6)
  pointLight2.position.set(-2, -1, 1)
  scene.add(pointLight2)

  // ---- State ----
  let isVisible = false
  let raf = null
  let scrollProgress = 0
  let mouse = { x: 0, y: 0 }
  let targetMouse = { x: 0, y: 0 }

  // ---- Intersection Observer ----
  createIntersectionObserver(
    wrapperEl,
    () => { isVisible = true; startRender() },
    () => { isVisible = false; stopRender() }
  )

  // ---- Mouse parallax (desktop) ----
  if (!isMobile()) {
    window.addEventListener('mousemove', e => {
      targetMouse.x = (e.clientX / window.innerWidth - 0.5) * 2
      targetMouse.y = -(e.clientY / window.innerHeight - 0.5) * 2
    })
  }

  // ---- Resize ----
  function handleResize() {
    const w = canvasEl.clientWidth
    const h = canvasEl.clientHeight
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  }

  window.addEventListener('resize', handleResize)

  // ---- Render loop ----
  let time = 0

  function render() {
    if (!isVisible) return
    raf = requestAnimationFrame(render)
    time += 0.008

    // Smooth mouse
    mouse.x += (targetMouse.x - mouse.x) * 0.05
    mouse.y += (targetMouse.y - mouse.y) * 0.05

    // Scroll-linked rotation
    group.rotation.y = scrollProgress * Math.PI * 2 + time * 0.3
    group.rotation.x = scrollProgress * 0.4 + Math.sin(time) * 0.05

    // Mouse parallax offset
    group.position.x = mouse.x * 0.3
    group.position.y = mouse.y * 0.2

    // Ring pulse
    ring.rotation.y += 0.005
    ring2.rotation.z += 0.003
    ring.material.opacity = 0.4 + Math.sin(time * 1.5) * 0.1
    ring2.material.opacity = 0.2 + Math.sin(time * 2) * 0.08

    // Particles slow drift
    particles.rotation.y += 0.001
    particles.rotation.x += 0.0005

    // Camera scroll effect
    camera.position.z = 5 - scrollProgress * 1.5

    renderer.render(scene, camera)
  }

  function startRender() {
    if (!raf) render()
  }

  function stopRender() {
    if (raf) { cancelAnimationFrame(raf); raf = null }
  }

  // ---- Public API ----
  return {
    setScrollProgress(p) { scrollProgress = p },
    dispose() {
      stopRender()
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
    }
  }
}
