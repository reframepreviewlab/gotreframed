/**
 * Three.js ambient section — defensive version
 */
import * as THREE from 'three'

function isMobile() { return window.innerWidth < 768 }

export function initThreeScene(canvasEl, wrapperEl) {
  if (!canvasEl || !wrapperEl) return null

  let w = canvasEl.clientWidth || window.innerWidth
  let h = canvasEl.clientHeight || window.innerHeight

  const renderer = new THREE.WebGLRenderer({
    canvas: canvasEl, alpha: true, antialias: !isMobile()
  })
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
  renderer.setPixelRatio(dpr)
  renderer.setSize(w, h)
  renderer.setClearColor(0x000000, 0)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 100)
  camera.position.set(0, 0, 5)

  const group = new THREE.Group()
  scene.add(group)

  // Monolith
  const geo = new THREE.BoxGeometry(1.2, 2.0, 1.2)
  group.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    color: 0x0d0f16, metalness: 0.8, roughness: 0.2
  })))
  group.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
    color: 0x5A52D6, wireframe: true, transparent: true, opacity: 0.3
  })))

  // Rings
  const ringGeo = new THREE.TorusGeometry(1.8, 0.015, 6, 80)
  const ring1 = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({
    color: 0x5A52D6, transparent: true, opacity: 0.5
  }))
  ring1.rotation.x = Math.PI / 2
  group.add(ring1)

  const ring2 = new THREE.Mesh(ringGeo.clone(), new THREE.MeshBasicMaterial({
    color: 0x8B7FFF, transparent: true, opacity: 0.25
  }))
  ring2.rotation.set(Math.PI / 3, 0, Math.PI / 6)
  group.add(ring2)

  // Particles
  const pCount = isMobile() ? 60 : 120
  const pos = new Float32Array(pCount * 3)
  for (let i = 0; i < pCount * 3; i++) pos[i] = (Math.random() - 0.5) * 8
  const pGeo = new THREE.BufferGeometry()
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
    color: 0x5A52D6, size: 0.025, transparent: true, opacity: 0.6
  }))
  scene.add(particles)

  // Lights
  scene.add(new THREE.AmbientLight(0x1a1a2e, 2))
  const pl1 = new THREE.PointLight(0x5A52D6, 4, 8)
  pl1.position.set(2, 2, 2); scene.add(pl1)
  const pl2 = new THREE.PointLight(0x8B7FFF, 2, 6)
  pl2.position.set(-2, -1, 1); scene.add(pl2)

  let isVisible = false
  let raf = null
  let scrollProgress = 0
  let time = 0
  let mouse = { x: 0, y: 0 }
  let targetMouse = { x: 0, y: 0 }

  // IntersectionObserver to pause when offscreen
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      isVisible = e.isIntersecting
      if (isVisible) startRender()
      else stopRender()
    })
  }, { threshold: 0.05 })
  observer.observe(wrapperEl)

  if (!isMobile()) {
    window.addEventListener('mousemove', e => {
      targetMouse.x = (e.clientX / window.innerWidth - 0.5) * 2
      targetMouse.y = -(e.clientY / window.innerHeight - 0.5) * 2
    })
  }

  window.addEventListener('resize', () => {
    w = canvasEl.clientWidth; h = canvasEl.clientHeight
    camera.aspect = w / h; camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  })

  function render() {
    if (!isVisible) return
    raf = requestAnimationFrame(render)
    time += 0.008
    mouse.x += (targetMouse.x - mouse.x) * 0.05
    mouse.y += (targetMouse.y - mouse.y) * 0.05

    group.rotation.y = scrollProgress * Math.PI * 2 + time * 0.3
    group.rotation.x = scrollProgress * 0.4 + Math.sin(time) * 0.05
    group.position.x = mouse.x * 0.3
    group.position.y = mouse.y * 0.2

    ring1.rotation.y += 0.005
    ring2.rotation.z += 0.003
    ring1.material.opacity = 0.4 + Math.sin(time * 1.5) * 0.1
    ring2.material.opacity = 0.2 + Math.sin(time * 2) * 0.08

    particles.rotation.y += 0.001
    camera.position.z = 5 - scrollProgress * 1.5

    renderer.render(scene, camera)
  }

  function startRender() { if (!raf) render() }
  function stopRender() { if (raf) { cancelAnimationFrame(raf); raf = null } }

  return {
    setScrollProgress(p) { scrollProgress = p },
    dispose() { stopRender(); renderer.dispose() }
  }
}
