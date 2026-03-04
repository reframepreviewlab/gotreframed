# Reframe — Scrollytelling Demo

Premium one-page scrollytelling site built with Vite, GSAP, and Three.js.  
Deployed at: `https://<your-username>.github.io/gotreframed/`

---

## Stack

- **Vite** — build tool
- **GSAP + ScrollTrigger** — scroll orchestration & animations
- **Three.js** — WebGL ambient section
- **Canvas API** — 160-frame sequence player

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Generate assets (one-time, ~2–4 min)
npm install canvas sharp   # extra deps for generator only
node generate-assets.js

# 3. (Optional) Generate GLB with Blender
blender --background --python generate-glb.py

# 4. Start dev server
npm run dev
# → http://localhost:5173/gotreframed/

# 5. Build for production
npm run build
# → dist/

# 6. Preview production build
npm run preview
```

---

## Asset Generation

### Sequence frames (required)
```bash
node generate-assets.js
```
Generates:
- `public/seq/frame_0001.webp` … `frame_0160.webp`
- `public/img/bg/noise.png`
- `public/img/shapes/shape-01.png` … `shape-12.png`

**Dependencies:** `npm install canvas sharp`

The frames are rendered via a deterministic canvas pipeline:
- Frames 1–56 (t=0–0.35): dark grid + flowing horizontal sine lines
- Frames 40–120 (t=0.25–0.75): lines converge, monolith geometry builds up with iso-top detail
- Frames 128–160 (t=0.8–1.0): crisp cube + lavender pulse rings + scan line

### GLB model (optional)
The Three.js scene constructs the geometry procedurally — the GLB is used as an optional enhancement.  
```bash
blender --background --python generate-glb.py
```
Produces `public/models/core.glb`.

### Mesh background (optional)
`public/img/bg/mesh.webp` is used as an optional texture overlay.  
You can create it with any gradient mesh generator (e.g. Figma mesh gradient plugin → export 2400×1400 WebP).  
The site renders gracefully without it — CSS radial gradients provide the base.

---

## GitHub Pages Deploy

1. Push to `main` branch
2. In repo settings → Pages → set source to **GitHub Actions**
3. The workflow at `.github/workflows/deploy.yml` runs automatically
4. Site available at `https://<username>.github.io/gotreframed/`

### Manual deploy
```bash
npm run build
# Upload dist/ to your static host
```

---

## Configuration

### Formspree contact form
Replace the form action endpoint in `index.html`:
```html
<form action="https://formspree.io/f/YOUR_FORM_ID" ...>
```
Get your free endpoint at [formspree.io](https://formspree.io).

### Frame count / mobile optimization
In `src/sequence.js`, adjust:
```js
this.totalFrames = 160  // total frames in public/seq/
this.step = isMobile() ? 2 : 1  // skip every 2nd frame on mobile
```

---

## Project Structure

```
gotreframed/
├── index.html                  Main HTML + all sections
├── src/
│   ├── main.js                 Bootstrap / orchestration
│   ├── styles.css              All global styles
│   ├── gsap-sections.js        GSAP ScrollTrigger logic
│   ├── sequence.js             Canvas frame player
│   ├── three-scene.js          Three.js WebGL section
│   └── utils/
│       ├── device.js           Mobile detection, pixel ratio, resize
│       └── preload.js          Image preloading utilities
├── public/
│   ├── seq/                    160 WebP sequence frames
│   ├── img/
│   │   ├── bg/                 Noise + mesh background
│   │   ├── shapes/             12 floating shape PNGs
│   │   └── ui/                 6 SVG UI cards
│   └── models/
│       └── core.glb            Low-poly Three.js model
├── generate-assets.js          Node canvas asset generator
├── generate-glb.py             Blender Python GLB exporter
├── vite.config.js
└── .github/workflows/deploy.yml
```

---

## Credits

Designed by [Reframe](https://www.getreframe.co.za)
