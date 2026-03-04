/**
 * gen-frames.js
 * Generates 160 WebP frames for the "Reframe Core Reveal" canvas sequence.
 *
 * USAGE:
 *   npm install canvas    (one-time setup)
 *   node scripts/gen-frames.js
 *
 * OUTPUT: public/seq/frame_0001.webp … frame_0160.webp
 *
 * The animation has 4 acts:
 *   Act 1 (frames 1–40):   Faint grid + drifting horizontal lines
 *   Act 2 (frames 41–100): Lines converge toward center, cube outline emerges
 *   Act 3 (frames 101–140): Cube solidifies with lavender surface
 *   Act 4 (frames 141–160): Final crisp cube + single lavender pulse glow
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '../public/seq');
const TOTAL = 160;
const W = 1400;
const H = 900;

// Ensure output dir
fs.mkdirSync(OUT_DIR, { recursive: true });

// ── Color palette ──────────────────────────────────────────────
const BG = '#0B0D10';
const ACCENT = 'rgba(90,82,214,'; // append opacity)
const ACCENT_LIGHT = 'rgba(139,133,232,';
const GRID_COLOR = 'rgba(90,82,214,0.06)';

// ── Helper: lerp ──────────────────────────────────────────────
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const easeInOut = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

// ── Draw persistent grid ───────────────────────────────────────
function drawGrid(ctx, opacity = 1) {
  ctx.strokeStyle = `rgba(90,82,214,${0.06 * opacity})`;
  ctx.lineWidth = 1;
  const step = 64;
  for (let x = 0; x <= W; x += step) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y <= H; y += step) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
}

// ── Draw drifting lines (act 1) ────────────────────────────────
function drawDriftLines(ctx, t, count = 12) {
  for (let i = 0; i < count; i++) {
    const phase = (i / count + t * 0.4) % 1;
    const y = phase * H;
    const opacity = Math.sin(phase * Math.PI) * 0.25;
    ctx.strokeStyle = `rgba(90,82,214,${opacity})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
}

// ── Draw converging lines (act 2) ─────────────────────────────
function drawConvergingLines(ctx, progress, count = 20) {
  const cx = W / 2, cy = H / 2;
  const p = easeInOut(progress);
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const startX = cx + Math.cos(angle) * W;
    const startY = cy + Math.sin(angle) * W;
    const endX = lerp(startX, cx, p);
    const endY = lerp(startY, cy, p);
    const opacity = 0.08 + p * 0.25;
    ctx.strokeStyle = `rgba(90,82,214,${opacity})`;
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }
}

// ── Draw cube outline ──────────────────────────────────────────
function drawCubeOutline(ctx, progress, filled = false) {
  const p = easeOut(clamp(progress, 0, 1));
  const size = lerp(60, 200, p);
  const cx = W / 2, cy = H / 2;
  const depth = size * 0.5;

  // Front face
  const fx = cx - size / 2, fy = cy - size / 2;
  const frontOpacity = p;
  const fillOpacity = filled ? p * 0.4 : 0;

  // Isometric-style: offset back face
  const ox = depth * 0.5, oy = -depth * 0.5;

  const frontPts = [
    [fx, fy + size], // bottom-left
    [fx + size, fy + size], // bottom-right
    [fx + size, fy], // top-right
    [fx, fy], // top-left
  ];
  const backPts = frontPts.map(([x, y]) => [x + ox, y + oy]);

  // Fill faces
  if (filled && fillOpacity > 0) {
    // Front face fill
    ctx.fillStyle = `rgba(26,29,46,${fillOpacity * 0.9})`;
    ctx.beginPath();
    ctx.moveTo(...frontPts[0]);
    frontPts.forEach(pt => ctx.lineTo(...pt));
    ctx.closePath();
    ctx.fill();

    // Top face fill
    ctx.fillStyle = `rgba(90,82,214,${fillOpacity * 0.3})`;
    ctx.beginPath();
    ctx.moveTo(...frontPts[3]);
    ctx.lineTo(...frontPts[2]);
    ctx.lineTo(...backPts[2]);
    ctx.lineTo(...backPts[3]);
    ctx.closePath();
    ctx.fill();

    // Right face fill
    ctx.fillStyle = `rgba(58,53,168,${fillOpacity * 0.5})`;
    ctx.beginPath();
    ctx.moveTo(...frontPts[1]);
    ctx.lineTo(...frontPts[2]);
    ctx.lineTo(...backPts[2]);
    ctx.lineTo(...backPts[1]);
    ctx.closePath();
    ctx.fill();
  }

  // Edges
  ctx.strokeStyle = `rgba(90,82,214,${frontOpacity * 0.9})`;
  ctx.lineWidth = 1.5;

  // Front face
  ctx.beginPath();
  ctx.moveTo(...frontPts[0]);
  frontPts.forEach(pt => ctx.lineTo(...pt));
  ctx.closePath();
  ctx.stroke();

  // Back face (dashed)
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = `rgba(90,82,214,${frontOpacity * 0.4})`;
  ctx.beginPath();
  ctx.moveTo(...backPts[0]);
  backPts.forEach(pt => ctx.lineTo(...pt));
  ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);

  // Connecting edges
  ctx.strokeStyle = `rgba(90,82,214,${frontOpacity * 0.6})`;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(...frontPts[i]);
    ctx.lineTo(...backPts[i]);
    ctx.stroke();
  }

  // Inner highlight line
  if (filled && p > 0.5) {
    const hp = (p - 0.5) * 2;
    ctx.strokeStyle = `rgba(139,133,232,${hp * 0.5})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - size / 2 + 10, cy);
    ctx.lineTo(cx + size / 2 - 10, cy);
    ctx.stroke();
  }
}

// ── Draw pulse glow (act 4) ────────────────────────────────────
function drawPulseGlow(ctx, progress) {
  const p = easeOut(clamp(progress, 0, 1));
  const cx = W / 2, cy = H / 2;

  // Layered radial glows
  const glows = [
    { r: 350, alpha: 0.05 },
    { r: 200, alpha: 0.12 },
    { r: 100, alpha: 0.2 },
    { r: 50,  alpha: 0.3 },
  ];

  glows.forEach(({ r, alpha }) => {
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * p);
    grad.addColorStop(0, `rgba(90,82,214,${alpha * p})`);
    grad.addColorStop(1, `rgba(90,82,214,0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r * p + 1, 0, Math.PI * 2);
    ctx.fill();
  });
}

// ── MAIN RENDER LOOP ───────────────────────────────────────────
console.log(`Generating ${TOTAL} frames into ${OUT_DIR}...`);
const t0 = Date.now();

for (let frame = 1; frame <= TOTAL; frame++) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // Normalized progress 0→1
  const t = (frame - 1) / (TOTAL - 1);

  // Background
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // Determine act
  const act1End = 40 / TOTAL;
  const act2End = 100 / TOTAL;
  const act3End = 140 / TOTAL;

  // ── Act 1: grid + drift ──────────────────────────────────
  if (t <= act1End) {
    const p = t / act1End;
    drawGrid(ctx, lerp(0.3, 1, p));
    drawDriftLines(ctx, t * TOTAL / 40, 12);
  }

  // ── Act 2: converge + cube outline appears ───────────────
  else if (t <= act2End) {
    const p = (t - act1End) / (act2End - act1End);
    drawGrid(ctx, 1);
    drawDriftLines(ctx, 1 + p * 0.5, lerp(12, 2, p));
    drawConvergingLines(ctx, p, 20);
    drawCubeOutline(ctx, p * 0.7, false);
  }

  // ── Act 3: cube solidifies ────────────────────────────────
  else if (t <= act3End) {
    const p = (t - act2End) / (act3End - act2End);
    drawGrid(ctx, lerp(1, 0.4, p));
    drawCubeOutline(ctx, 0.7 + p * 0.3, true);
  }

  // ── Act 4: glow pulse ─────────────────────────────────────
  else {
    const p = (t - act3End) / (1 - act3End);
    drawGrid(ctx, 0.4);
    drawCubeOutline(ctx, 1, true);
    drawPulseGlow(ctx, p);

    // Outer ring sparkles
    const count = Math.floor(p * 8);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + t * 2;
      const r = 220 + Math.sin(angle * 3) * 20;
      const cx = W / 2 + Math.cos(angle) * r;
      const cy = H / 2 + Math.sin(angle) * r;
      ctx.fillStyle = `rgba(139,133,232,${p * 0.6})`;
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Frame number overlay (debugging — comment out for production)
  // ctx.fillStyle = 'rgba(255,255,255,0.2)';
  // ctx.font = '12px monospace';
  // ctx.fillText(`${frame}/${TOTAL}`, 16, 24);

  // Write WebP
  const num = String(frame).padStart(4, '0');
  const outPath = path.join(OUT_DIR, `frame_${num}.webp`);
  const buffer = canvas.toBuffer('image/webp', { quality: 0.82 });
  fs.writeFileSync(outPath, buffer);

  if (frame % 20 === 0) {
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`  ${frame}/${TOTAL} — ${elapsed}s`);
  }
}

console.log(`\n✓ Done! ${TOTAL} frames in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
console.log(`  Output: ${OUT_DIR}/frame_0001.webp … frame_${String(TOTAL).padStart(4,'0')}.webp`);
